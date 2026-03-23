# Backend + Auth Design

**Date:** 2026-03-23
**Status:** Approved

## Goal

Replace per-device localStorage guide storage with a per-user database backend, protected by email/password and Google OAuth authentication.

## Stack

| Layer | Technology |
|---|---|
| Auth | Auth.js v5 (`next-auth@beta`) |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle |
| Deployment | Vercel |

---

## Environment Variables

All of the following must be added to `.env.local` for local development and to Vercel environment settings for deployment.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon connection string (pooled, from Neon dashboard) |
| `AUTH_SECRET` | Random secret for signing Auth.js JWTs — generate with `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `ANTHROPIC_API_KEY` | Already documented in CLAUDE.md — unchanged |

---

## Architecture

Three new layers sit alongside the existing Next.js 16 App Router app:

```
Auth layer       Auth.js v5 (next-auth@beta)
                 ├── Credentials provider  (email + bcrypt)
                 └── OAuth provider        (Google)

Database layer   Neon Postgres
                 └── Drizzle ORM  (TypeScript schema, type-safe queries)

API layer        New Next.js route handlers
                 ├── GET  /api/guides        list authenticated user's guides
                 ├── POST /api/guides        save a guide
                 └── DELETE /api/guides/[id] delete a guide
```

The existing `POST /api/travel` route is unchanged in behaviour but gains an auth check — unauthenticated requests return `401`.

### New files

```
src/
  lib/
    auth.ts                        Auth.js config (providers, callbacks, JWT strategy)
    db/
      schema.ts                    Drizzle table definitions
      index.ts                     Neon connection + Drizzle instance
  app/
    auth/
      sign-in/page.tsx
      sign-up/page.tsx
    api/
      auth/[...nextauth]/route.ts  Auth.js handler
      guides/
        route.ts                   GET (list) + POST (save)
        [id]/route.ts              DELETE
  middleware.ts                    Protects /api/guides/* and /api/travel
drizzle.config.ts                  Drizzle Kit config (root level)
```

`src/middleware.ts` is the correct path when using the `src/` directory layout (Next.js App Router resolves it from `src/` when that is the app root).

### Existing files modified

| File | Change |
|---|---|
| `src/hooks/useGuides.ts` | Rewritten to call API routes instead of localStorage; exposes `loading` and `error` state |
| `src/app/page.tsx` | Add user menu (name + sign-out); sign-in gate on Save; consume new `loading`/`error` from hook |
| `src/app/api/travel/route.ts` | Add `auth()` check; return 401 if no session |

### Kept unchanged

`src/lib/guides-storage.ts` is kept as-is and used only for the one-time localStorage migration path. It is not called in normal app flow after this feature lands.

---

## Database Schema

Five tables. The first four are required by Auth.js's Drizzle adapter (`@auth/drizzle-adapter`).

```typescript
// users
{
  id:             uuid PRIMARY KEY  default gen_random_uuid()
  name:           text
  email:          text UNIQUE NOT NULL
  password_hash:  text              -- null for OAuth-only users
  email_verified: timestamp         -- Auth.js sets this
  created_at:     timestamp         default now()
}

// accounts — links OAuth tokens to a user (Auth.js managed)
{
  user_id:             uuid FK→users.id
  provider:            text          -- e.g. "google"
  provider_account_id: text
  // ...standard Auth.js adapter fields
}

// sessions — required by @auth/drizzle-adapter even with JWT strategy
{
  session_token: text PRIMARY KEY
  user_id:       uuid FK→users.id NOT NULL
  expires:       timestamp NOT NULL
}

// verification_tokens — used by Auth.js for email verification / magic links
{
  identifier: text
  token:      text
  expires:    timestamp
}

// guides — application data
{
  id:             text PRIMARY KEY  -- existing format "DEST_DDMMYY_RANDOM6"
  user_id:        uuid FK→users.id NOT NULL
  destination:    text NOT NULL
  departure_date: text NOT NULL
  return_date:    text NOT NULL
  group_type:     text NOT NULL
  group_size:     jsonb NOT NULL    -- { adults: number, children: number }
  report:         jsonb NOT NULL    -- full TravelReport
  form_data:      jsonb NOT NULL    -- TravelFormValues
  created_at:     timestamp         default now()
}
```

The `guides` table maps 1:1 to the existing `SavedGuide` interface — no fields are added or removed. `group_size`, `report`, and `form_data` are JSONB.

### Migrations

Drizzle Kit is used for schema management:

- **Development:** `npx drizzle-kit push` — pushes schema directly to the Neon dev database (no migration files)
- **Production:** `npx drizzle-kit generate` then `npx drizzle-kit migrate` — generates SQL migration files in `drizzle/` and applies them; migrations run as a Vercel build step via `package.json` `build` script: `"build": "drizzle-kit migrate && next build"`

`drizzle.config.ts` lives at the project root and points to `src/lib/db/schema.ts` and the `DATABASE_URL` env var.

---

## Auth Flow

### Sign up (email/password)

1. User submits name, email, password on `/auth/sign-up`
2. Server action: check email not already taken → hash password with `bcrypt` (cost factor 12) → insert `users` row
3. Automatically sign in via `signIn("credentials", ...)` → redirect to `/`

### Sign in (email/password)

1. User submits email + password on `/auth/sign-in`
2. Auth.js Credentials provider:
   - Look up user by email
   - If no user found, or `password_hash` is `null` (OAuth-only account): return `null` with generic error
   - `bcrypt.compare(password, password_hash)` — if mismatch: return `null`
   - Return user object
3. Auth.js issues a JWT stored in an HTTP-only cookie (30-day expiry)

### Sign in (Google OAuth)

1. User clicks "Continue with Google" → Auth.js redirects to Google consent screen
2. On callback: Auth.js creates or links a `users` row + `accounts` row automatically via Drizzle adapter
3. JWT issued, same HTTP-only cookie

### Session user ID in JWT

Auth.js v5 does not include `user.id` in the session by default. The `auth.ts` config must include explicit callbacks to propagate it:

```typescript
callbacks: {
  jwt({ token, user }) {
    if (user?.id) token.sub = user.id;   // persist on sign-in
    return token;
  },
  session({ session, token }) {
    if (token.sub) session.user.id = token.sub;  // expose to route handlers
    return session;
  },
}
```

### Session access in route handlers

```typescript
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });
  // session.user.id is the UUID from the users table
}
```

### Middleware

`src/middleware.ts` protects `/api/guides/*` and `/api/travel` before requests reach route handlers. Unauthenticated requests to these paths return `401` without running any handler code.

### Out of scope

Email verification and password reset are explicitly deferred — both can be added later without structural changes to the schema or auth config.

---

## UI Changes

### Auth pages

`/auth/sign-in` and `/auth/sign-up` use the existing app styling (white card, Tailwind). Sign-in: email + password fields, "Continue with Google" button, link to sign-up. Sign-up: name + email + password, "Continue with Google", link to sign-in. Both redirect to `/` on success.

### User menu

A small addition to the existing page header: when logged in, show the user's name and a "Sign out" button. When logged out, show a "Sign in" link.

### Save guide — auth gate

When not logged in, clicking Save redirects to `/auth/sign-in?callbackUrl=/` instead of writing to storage. When logged in, it calls `POST /api/guides`.

### `useGuides` hook

Rewritten to call API routes. The hook now exposes `loading` and `error` in addition to `guides`, `save`, and `remove`:

```typescript
{ guides: SavedGuide[], save: (guide: SavedGuide) => Promise<void>, remove: (id: string) => Promise<void>, loading: boolean, error: string | null }
```

`save` and `remove` are now async (network calls vs synchronous localStorage). `page.tsx` is updated to handle the new `loading`/`error` fields.

### localStorage migration

On first sign-in, if `localStorage` contains any guides, a one-time banner appears: *"You have N guides saved locally — import them to your account?"*

- Clicking Import: calls `POST /api/guides` for each guide individually; only clears each entry from localStorage after its save succeeds (partial failure is safe — re-running the import is idempotent via `ON CONFLICT (id) DO NOTHING`). After all succeed, sets `guidesImportDismissed = true` in localStorage.
- Dismissing: sets `guidesImportDismissed = true` immediately without importing.

The banner never reappears once `guidesImportDismissed` is set.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Sign-up with existing email | Form error: "An account with this email already exists" |
| Wrong password or OAuth-only account tries credentials | Generic error: "Invalid email or password" (no user enumeration) |
| DB unavailable | `500` with `{ success: false, code: "DB_ERROR" }` — matches existing API error shape |
| OAuth account collision | Auth.js built-in error page: "account already linked" |
| Guide save fails | Toast notification; guide stays in pending state |
| Unauthenticated API call | `401` — caught by middleware before handler runs |
| Partial migration failure | Failed guides remain in localStorage; re-running import is safe (idempotent) |

---

## Testing

Follows the existing TDD pattern (failing test → commit → implement → verify pass → commit).

| File | Coverage |
|---|---|
| `src/__tests__/api/guides.test.ts` | GET/POST/DELETE handlers with mocked Drizzle; 401 when no session; success path; 403/404 on wrong user's guide |
| `src/__tests__/lib/auth.test.ts` | Credentials provider: wrong password → `null`; null `password_hash` (OAuth-only user) → `null`; unknown email → `null`; valid credentials → user object |
| `src/__tests__/components/AuthForms.test.tsx` | RTL: form validation for sign-in and sign-up (empty fields, short password) |

End-to-end OAuth flow testing (e.g. Playwright) is out of scope for this phase.
