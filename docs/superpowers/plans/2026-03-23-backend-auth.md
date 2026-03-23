# Backend + Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace localStorage guide storage with a per-user Neon Postgres database, protected by Auth.js v5 email/password + Google OAuth.

**Architecture:** Auth.js v5 handles sessions (JWT strategy, HTTP-only cookie). Drizzle ORM manages a Neon Postgres schema with five tables (four Auth.js adapter tables + `guides`). New API routes (`/api/guides`) replace direct localStorage calls. The `useGuides` hook is rewritten to call the API; its external interface gains `loading` and `error` fields.

**Tech Stack:** `next-auth@beta`, `@auth/drizzle-adapter`, `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `bcryptjs`

**Spec:** `docs/superpowers/specs/2026-03-23-backend-auth-design.md`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `drizzle.config.ts` | Drizzle Kit config (points at schema + DATABASE_URL) |
| Create | `src/lib/db/schema.ts` | All 5 Drizzle table definitions |
| Create | `src/lib/db/index.ts` | Neon HTTP connection + Drizzle instance export |
| Create | `src/lib/auth-credentials.ts` | Extracted `authorizeCredentials()` — testable unit |
| Create | `src/lib/auth.ts` | Auth.js config: providers, adapter, JWT callbacks |
| Create | `src/app/api/auth/[...nextauth]/route.ts` | Auth.js GET+POST handler |
| Create | `src/app/api/guides/route.ts` | GET (list) + POST (save) guides |
| Create | `src/app/api/guides/[id]/route.ts` | DELETE guide |
| Create | `src/middleware.ts` | Protects `/api/guides/*` and `/api/travel` with auth check |
| Create | `src/components/Providers.tsx` | Client wrapper for `SessionProvider` |
| Create | `src/app/auth/sign-in/page.tsx` | Sign-in form (credentials + Google) |
| Create | `src/app/auth/sign-up/page.tsx` | Sign-up form |
| Create | `src/app/auth/sign-up/actions.ts` | Server action: validate → hash → insert user → sign in |
| Create | `src/components/MigrationBanner.tsx` | One-time localStorage import banner |
| Modify | `src/app/layout.tsx` | Wrap children with `<Providers>` |
| Modify | `src/hooks/useGuides.ts` | Rewrite to call API; add `loading` + `error` |
| Modify | `src/app/page.tsx` | User menu, auth gate on Save, consume new hook fields |
| Modify | `src/app/api/travel/route.ts` | Add `auth()` check; return 401 if no session |
| Create | `src/__tests__/lib/auth-credentials.test.ts` | Unit tests for `authorizeCredentials` |
| Create | `src/__tests__/api/guides.test.ts` | Unit tests for guides route handlers |
| Create | `src/__tests__/components/AuthForms.test.tsx` | RTL tests for sign-in + sign-up forms |
| Modify | `src/__tests__/api/travel.test.ts` | Add 401-without-session test |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install next-auth@beta @auth/drizzle-adapter drizzle-orm @neondatabase/serverless bcryptjs
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D drizzle-kit @types/bcryptjs
```

- [ ] **Step 3: Verify packages are present**

```bash
node -e "require('next-auth'); require('@auth/drizzle-adapter'); require('drizzle-orm'); require('@neondatabase/serverless'); require('bcryptjs'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install next-auth, drizzle, neon, bcryptjs dependencies"
```

---

## Task 2: DB schema, connection, and Drizzle config

**Files:**
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/index.ts`
- Create: `drizzle.config.ts`

No unit tests for DB infrastructure — verified by running `drizzle-kit push` successfully.

- [ ] **Step 1: Add `DATABASE_URL` to `.env.local`**

Create a Neon project at neon.tech, copy the pooled connection string, and add:

```
DATABASE_URL=postgres://...
```

- [ ] **Step 2: Create `src/lib/db/schema.ts`**

```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("passwordHash"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const guides = pgTable("guide", {
  id: text("id").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  destination: text("destination").notNull(),
  departureDate: text("departureDate").notNull(),
  returnDate: text("returnDate").notNull(),
  groupType: text("groupType").notNull(),
  groupSize: jsonb("groupSize").notNull(),
  report: jsonb("report").notNull(),
  formData: jsonb("formData").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});
```

- [ ] **Step 3: Create `src/lib/db/index.ts`**

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 4: Create `drizzle.config.ts`**

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

- [ ] **Step 5: Push schema to Neon**

```bash
npx drizzle-kit push
```

Expected: all 5 tables created with no errors. If prompted, confirm changes.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/ drizzle.config.ts
git commit -m "feat: add Drizzle schema and Neon DB connection"
```

---

## Task 3: Auth credentials logic (TDD)

**Files:**
- Create: `src/__tests__/lib/auth-credentials.test.ts`
- Create: `src/lib/auth-credentials.ts`

The `authorizeCredentials` function is extracted from Auth.js config so it can be tested independently.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/lib/auth-credentials.test.ts`:

```typescript
/**
 * @jest-environment node
 */
import { authorizeCredentials } from "@/lib/auth-credentials";

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
  },
}));
jest.mock("bcryptjs");

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const mockSelect = db.select as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;

function mockDbUser(user: {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
} | null) {
  mockSelect.mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(user ? [user] : []),
      }),
    }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("authorizeCredentials", () => {
  it("returns null when user is not found", async () => {
    mockDbUser(null);
    const result = await authorizeCredentials("unknown@example.com", "password");
    expect(result).toBeNull();
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it("returns null when user has no passwordHash (OAuth-only account)", async () => {
    mockDbUser({ id: "1", email: "user@example.com", name: "Alice", passwordHash: null });
    const result = await authorizeCredentials("user@example.com", "password");
    expect(result).toBeNull();
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it("returns null when password does not match", async () => {
    mockDbUser({ id: "1", email: "user@example.com", name: "Alice", passwordHash: "$2b$12$hashed" });
    mockCompare.mockResolvedValue(false);
    const result = await authorizeCredentials("user@example.com", "wrongpassword");
    expect(result).toBeNull();
  });

  it("returns user object when credentials are valid", async () => {
    mockDbUser({ id: "abc-123", email: "user@example.com", name: "Alice", passwordHash: "$2b$12$hashed" });
    mockCompare.mockResolvedValue(true);
    const result = await authorizeCredentials("user@example.com", "correct");
    expect(result).toEqual({ id: "abc-123", email: "user@example.com", name: "Alice" });
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (module not found)**

```bash
npx jest src/__tests__/lib/auth-credentials.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/auth-credentials'`

- [ ] **Step 3: Commit failing tests**

```bash
git add src/__tests__/lib/auth-credentials.test.ts
git commit -m "test: add authorizeCredentials unit tests (failing — TDD)"
```

- [ ] **Step 4: Create `src/lib/auth-credentials.ts`**

```typescript
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
}

export async function authorizeCredentials(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = rows[0] ?? null;
  if (!user || !user.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email };
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npx jest src/__tests__/lib/auth-credentials.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth-credentials.ts
git commit -m "feat: add authorizeCredentials function"
```

---

## Task 4: Auth.js config + route handler + SessionProvider

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/components/Providers.tsx`
- Modify: `src/app/layout.tsx`

No unit tests here — Auth.js config and OAuth callbacks are integration-level. The `authorizeCredentials` function (already tested) is the unit under test.

- [ ] **Step 1: Add auth environment variables to `.env.local`**

```
AUTH_SECRET=<generate with: openssl rand -base64 32>
AUTH_GOOGLE_ID=<from Google Cloud Console OAuth credentials>
AUTH_GOOGLE_SECRET=<from Google Cloud Console OAuth credentials>
```

To get Google credentials: go to https://console.cloud.google.com → APIs & Services → Credentials → Create OAuth 2.0 Client ID → Web application → add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI.

Also add these to Vercel environment settings for production.

- [ ] **Step 2: Create `src/lib/auth.ts`**

```typescript
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { authorizeCredentials } from "@/lib/auth-credentials";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        return authorizeCredentials(
          credentials.email as string,
          credentials.password as string
        );
      },
    }),
    Google,
  ],
  callbacks: {
    jwt({ token, user }) {
      // Persist user.id into the token on first sign-in
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      // Expose user.id to route handlers via session
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
  },
});
```

- [ ] **Step 3: Create `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 4: Create `src/components/Providers.tsx`**

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 5: Modify `src/app/layout.tsx` — wrap children with Providers**

Replace:
```tsx
<body className="min-h-full flex flex-col">{children}</body>
```

With:
```tsx
import { Providers } from "@/components/Providers";
// ...
<body className="min-h-full flex flex-col">
  <Providers>{children}</Providers>
</body>
```

Full updated `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Planner — AI-Powered Travel Guide",
  description:
    "Get personalised travel recommendations powered by Claude AI. Safety status, attractions, cuisine, and practical info for any destination.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify build compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds (or only pre-existing warnings — no new errors).

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/components/Providers.tsx src/app/layout.tsx
git commit -m "feat: add Auth.js v5 config with Credentials + Google providers"
```

---

## Task 5: Guides API routes (TDD)

**Files:**
- Create: `src/__tests__/api/guides.test.ts`
- Create: `src/app/api/guides/route.ts`
- Create: `src/app/api/guides/[id]/route.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/api/guides.test.ts`:

```typescript
/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/guides/route";
import { DELETE } from "@/app/api/guides/[id]/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock("@/lib/db/schema", () => ({ guides: {} }));
jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const mockAuth = auth as jest.Mock;
const mockSelect = db.select as jest.Mock;
const mockInsert = db.insert as jest.Mock;
const mockDelete = db.delete as jest.Mock;

const SESSION = { user: { id: "user-uuid-123" } };

const DB_GUIDE = {
  id: "PARIS_200326_AB12CD",
  userId: "user-uuid-123",
  destination: "Paris",
  departureDate: "2099-12-01",
  returnDate: "2099-12-10",
  groupType: "Solo",
  groupSize: { adults: 1, children: 0 },
  report: { safety: { level: "GREEN" } },
  formData: {},
  createdAt: new Date("2026-03-23"),
};

const GUIDE_BODY = {
  id: "PARIS_200326_AB12CD",
  destination: "Paris",
  departureDate: "2099-12-01",
  returnDate: "2099-12-10",
  groupType: "Solo",
  groupSize: { adults: 1, children: 0 },
  report: { safety: { level: "GREEN" } },
  formData: {},
  createdAt: "2026-03-23T00:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue(SESSION);
});

describe("GET /api/guides", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns guides list for authenticated user", async () => {
    mockSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([DB_GUIDE]),
        }),
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.guides).toHaveLength(1);
    expect(json.guides[0].destination).toBe("Paris");
    expect(json.guides[0].createdAt).toBe("2026-03-23T00:00:00.000Z");
  });
});

describe("POST /api/guides", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/guides", {
      method: "POST",
      body: JSON.stringify(GUIDE_BODY),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("saves guide and returns 200", async () => {
    mockInsert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
      }),
    });
    const req = new NextRequest("http://localhost/api/guides", {
      method: "POST",
      body: JSON.stringify(GUIDE_BODY),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

describe("DELETE /api/guides/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/guides/PARIS_200326_AB12CD");
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "PARIS_200326_AB12CD" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when guide not found or belongs to another user", async () => {
    mockDelete.mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
    });
    const req = new NextRequest("http://localhost/api/guides/NONEXISTENT");
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "NONEXISTENT" }),
    });
    expect(res.status).toBe(404);
  });

  it("deletes guide and returns 200", async () => {
    mockDelete.mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: "PARIS_200326_AB12CD" }]),
      }),
    });
    const req = new NextRequest("http://localhost/api/guides/PARIS_200326_AB12CD");
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "PARIS_200326_AB12CD" }),
    });
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (modules not found)**

```bash
npx jest src/__tests__/api/guides.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/guides/route'`

- [ ] **Step 3: Commit failing tests**

```bash
git add src/__tests__/api/guides.test.ts
git commit -m "test: add guides API route tests (failing — TDD)"
```

- [ ] **Step 4: Create `src/app/api/guides/route.ts`**

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { guides } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import type { SavedGuide } from "@/lib/guides-storage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const rows = await db
    .select()
    .from(guides)
    .where(eq(guides.userId, session.user.id))
    .orderBy(desc(guides.createdAt));

  const result: SavedGuide[] = rows.map((row) => ({
    id: row.id,
    destination: row.destination,
    departureDate: row.departureDate,
    returnDate: row.returnDate,
    groupType: row.groupType,
    groupSize: row.groupSize as SavedGuide["groupSize"],
    report: row.report as SavedGuide["report"],
    formData: row.formData as SavedGuide["formData"],
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return NextResponse.json({ success: true, guides: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const guide = (await req.json()) as SavedGuide;

  await db
    .insert(guides)
    .values({
      id: guide.id,
      userId: session.user.id,
      destination: guide.destination,
      departureDate: guide.departureDate,
      returnDate: guide.returnDate,
      groupType: guide.groupType,
      groupSize: guide.groupSize,
      report: guide.report,
      formData: guide.formData,
    })
    .onConflictDoNothing();

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 5: Create `src/app/api/guides/[id]/route.ts`**

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { guides } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const deleted = await db
    .delete(guides)
    .where(and(eq(guides.id, id), eq(guides.userId, session.user.id)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json(
      { success: false, error: "Not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npx jest src/__tests__/api/guides.test.ts
```

Expected: 6 tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/api/guides/
git commit -m "feat: add guides API routes (GET, POST, DELETE)"
```

---

## Task 6: Middleware + protect /api/travel (TDD)

**Files:**
- Create: `src/middleware.ts`
- Modify: `src/__tests__/api/travel.test.ts`
- Modify: `src/app/api/travel/route.ts`

- [ ] **Step 1: Add 401 test to `src/__tests__/api/travel.test.ts`**

Add a mock for `@/lib/auth` at the top (after existing mocks):

```typescript
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
import { auth } from "@/lib/auth";
const mockAuth = auth as jest.Mock;
```

Add to the `beforeEach`:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-123" } }); // authenticated by default
  mockCreate
    .mockResolvedValueOnce(EXPERIENCES_RESPONSE)
    .mockResolvedValueOnce(PRACTICALITIES_RESPONSE);
});
```

Add this test case inside `describe("POST /api/travel")`:

```typescript
it("returns 401 when not authenticated", async () => {
  mockAuth.mockResolvedValue(null);
  const res = await POST(makeRequest(VALID_BODY));
  expect(res.status).toBe(401);
  const json = await res.json();
  expect(json.success).toBe(false);
  expect(json.code).toBe("UNAUTHORIZED");
});
```

- [ ] **Step 2: Run travel tests — expect 1 new FAIL**

```bash
npx jest src/__tests__/api/travel.test.ts
```

Expected: 6 existing PASS + 1 new FAIL (auth check not yet added to route)

- [ ] **Step 3: Commit the failing test**

```bash
git add src/__tests__/api/travel.test.ts
git commit -m "test: add 401 test for unauthenticated /api/travel (failing — TDD)"
```

- [ ] **Step 4: Add auth check to `src/app/api/travel/route.ts`**

Add this import at the top:

```typescript
import { auth } from "@/lib/auth";
```

Add this block at the start of the `POST` handler body (before the `req.json()` call):

```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json(
    { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
    { status: 401 }
  );
}
```

- [ ] **Step 5: Run travel tests — expect all PASS**

```bash
npx jest src/__tests__/api/travel.test.ts
```

Expected: 7 tests PASS

- [ ] **Step 6: Create `src/middleware.ts`**

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/api/guides/:path*", "/api/travel"],
};
```

- [ ] **Step 7: Run full test suite to confirm no regressions**

```bash
npx jest
```

Expected: all test suites PASS

- [ ] **Step 8: Commit**

```bash
git add src/middleware.ts src/app/api/travel/route.ts src/__tests__/api/travel.test.ts
git commit -m "feat: add middleware auth guard and protect /api/travel"
```

---

## Task 7: Auth UI pages (TDD)

**Files:**
- Create: `src/__tests__/components/AuthForms.test.tsx`
- Create: `src/app/auth/sign-in/page.tsx`
- Create: `src/app/auth/sign-up/page.tsx`
- Create: `src/app/auth/sign-up/actions.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/AuthForms.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import SignInPage from "@/app/auth/sign-in/page";
import SignUpPage from "@/app/auth/sign-up/page";

// Mock next-auth/react signIn (used by sign-in form)
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

// Mock the sign-up server action
jest.mock("@/app/auth/sign-up/actions", () => ({
  signUpAction: jest.fn(),
}));

describe("SignInPage", () => {
  it("renders email input", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders password input", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders sign in submit button", () => {
    render(<SignInPage />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders Continue with Google button", () => {
    render(<SignInPage />);
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("renders link to sign up page", () => {
    render(<SignInPage />);
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
  });
});

describe("SignUpPage", () => {
  it("renders name input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it("renders email input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders password input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders create account button", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders Continue with Google button", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx jest src/__tests__/components/AuthForms.test.tsx
```

Expected: FAIL — modules not found

- [ ] **Step 3: Commit failing tests**

```bash
git add src/__tests__/components/AuthForms.test.tsx
git commit -m "test: add AuthForms component tests (failing — TDD)"
```

- [ ] **Step 4: Create `src/app/auth/sign-up/actions.ts`**

```typescript
"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";

export async function signUpAction(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ name, email, passwordHash });

  await signIn("credentials", { email, password, redirectTo: "/" });
  return { error: null };
}
```

- [ ] **Step 5: Create `src/app/auth/sign-in/page.tsx`**

```tsx
"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      window.location.href = "/";
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Sign in</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          No account?{" "}
          <Link href="/auth/sign-up" className="font-medium text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Create `src/app/auth/sign-up/page.tsx`**

```tsx
"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useActionState } from "react";
import { signUpAction } from "./actions";

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUpAction, { error: null });

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Create account</h1>

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
npx jest src/__tests__/components/AuthForms.test.tsx
```

Expected: 10 tests PASS

- [ ] **Step 8: Commit**

```bash
git add src/app/auth/ src/__tests__/components/AuthForms.test.tsx
git commit -m "feat: add sign-in and sign-up pages"
```

---

## Task 8: Rewrite useGuides hook

**Files:**
- Modify: `src/hooks/useGuides.ts`

The hook's external shape changes: `save` and `remove` become async (`Promise<void>`), and `loading` + `error` are added.

- [ ] **Step 1: Rewrite `src/hooks/useGuides.ts`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import type { SavedGuide } from "@/lib/guides-storage";

export function useGuides() {
  const [guides, setGuides] = useState<SavedGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGuides() {
      try {
        const res = await fetch("/api/guides");
        if (res.status === 401) {
          // Not signed in — empty guides, not an error
          setGuides([]);
          return;
        }
        if (!res.ok) throw new Error("Failed to load guides");
        const data = await res.json();
        setGuides(data.guides ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchGuides();
  }, []);

  const save = useCallback(async (guide: SavedGuide): Promise<void> => {
    const res = await fetch("/api/guides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guide),
    });
    if (!res.ok) throw new Error("Failed to save guide");
    setGuides((prev) => [guide, ...prev]);
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/guides/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete guide");
    setGuides((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return { guides, save, remove, loading, error };
}
```

- [ ] **Step 2: Run full test suite to confirm no regressions**

```bash
npx jest
```

Expected: all suites PASS (no tests directly test useGuides at this stage)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGuides.ts
git commit -m "feat: rewrite useGuides hook to call API routes"
```

---

## Task 9: Update page.tsx — user menu, auth gate, loading/error

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite `src/app/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { TravelReport } from "@/types/travel";
import type { TravelFormValues } from "@/lib/schemas";
import { useGuides } from "@/hooks/useGuides";
import TravelForm from "@/components/TravelForm";
import MyGuidesPage from "@/components/MyGuides";
import type { SavedGuide } from "@/lib/guides-storage";

type Tab = "new" | "guides";

export interface PendingReport {
  report: TravelReport;
  destination: string;
  formData: TravelFormValues;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [pendingReport, setPendingReport] = useState<PendingReport | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: session } = useSession();
  const router = useRouter();
  const { guides, save, remove } = useGuides();

  function handleReport(newReport: TravelReport, dest: string, data: TravelFormValues) {
    setPendingReport({ report: newReport, destination: dest, formData: data });
    setActiveTab("guides");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSavePending(guide: SavedGuide) {
    if (!session) {
      router.push("/auth/sign-in?callbackUrl=/");
      return;
    }
    try {
      setSaveError(null);
      await save(guide);
      setPendingReport(null);
    } catch {
      setSaveError("Failed to save guide — please try again.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await remove(id);
    } catch {
      // silent — guide stays in list
    }
  }

  async function handleDownload(guide: SavedGuide) {
    const { generateTravelPDF } = await import("@/lib/pdf-generator");
    generateTravelPDF(guide.report, guide.formData, guide.id);
  }

  const guideCount = guides.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">✈️ Travel Planner</h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-gray-600">
              AI-generated travel guides — safety, attractions, food, and everything you need.
            </p>
          </div>

          {/* User menu */}
          <div className="shrink-0 ml-4 mt-1">
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{session.user?.name}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <a
                href="/auth/sign-in"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign in
              </a>
            )}
          </div>
        </div>

        {saveError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {/* Tab navigation */}
        <div className="mb-8 flex gap-1 rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "new"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ✈️ New Guide
          </button>
          <button
            onClick={() => setActiveTab("guides")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "guides"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🗺️ My Guides
            {guideCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                {guideCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "new" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <TravelForm onReport={handleReport} />
          </div>
        ) : (
          <MyGuidesPage
            guides={guides}
            pendingReport={pendingReport}
            onSavePending={handleSavePending}
            onDelete={handleDelete}
            onDownload={handleDownload}
          />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx jest
```

Expected: all suites PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add user menu and auth gate to page.tsx"
```

---

## Task 10: localStorage migration banner

**Files:**
- Create: `src/components/MigrationBanner.tsx`
- Modify: `src/app/page.tsx` (add banner)

- [ ] **Step 1: Create `src/components/MigrationBanner.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { getGuides } from "@/lib/guides-storage";
import type { SavedGuide } from "@/lib/guides-storage";

const DISMISSED_KEY = "guidesImportDismissed";

interface Props {
  onImport: (guide: SavedGuide) => Promise<void>;
}

export function MigrationBanner({ onImport }: Props) {
  const [localGuides, setLocalGuides] = useState<SavedGuide[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    const guides = getGuides();
    if (guides.length > 0) setLocalGuides(guides);
  }, []);

  if (localGuides.length === 0 || done) return null;

  async function handleImport() {
    setImporting(true);
    const remaining = [...localGuides];
    for (const guide of localGuides) {
      try {
        await onImport(guide);
        // Remove each guide from localStorage only after successful save
        const stored = localStorage.getItem("travelGuides");
        if (stored) {
          const all = JSON.parse(stored) as SavedGuide[];
          localStorage.setItem(
            "travelGuides",
            JSON.stringify(all.filter((g) => g.id !== guide.id))
          );
        }
        remaining.splice(remaining.indexOf(guide), 1);
      } catch {
        // leave failed guides in localStorage — retry on next sign-in
      }
    }
    localStorage.setItem(DISMISSED_KEY, "1");
    setImporting(false);
    setDone(true);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setLocalGuides([]);
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
      <span className="text-blue-800">
        You have {localGuides.length} guide{localGuides.length !== 1 ? "s" : ""} saved locally — import them to your account?
      </span>
      <div className="ml-4 flex shrink-0 gap-2">
        <button
          onClick={handleImport}
          disabled={importing}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import"}
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `MigrationBanner` to `src/app/page.tsx`**

Add import at top:
```tsx
import { MigrationBanner } from "@/components/MigrationBanner";
```

Add banner inside the guides tab content, just before `<MyGuidesPage ...`:
```tsx
{activeTab === "guides" && session && (
  <MigrationBanner onImport={save} />
)}
```

Place it just above the `{activeTab === "new" ? ...}` block or inside the guides branch.

Full updated guides tab section:
```tsx
{activeTab === "new" ? (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
    <TravelForm onReport={handleReport} />
  </div>
) : (
  <>
    {session && <MigrationBanner onImport={save} />}
    <MyGuidesPage
      guides={guides}
      pendingReport={pendingReport}
      onSavePending={handleSavePending}
      onDelete={handleDelete}
      onDownload={handleDownload}
    />
  </>
)}
```

- [ ] **Step 3: Run full test suite**

```bash
npx jest
```

Expected: all suites PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/MigrationBanner.tsx src/app/page.tsx
git commit -m "feat: add localStorage migration banner for existing guides"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npx jest
```

Expected: all test suites PASS, 0 failures.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: build succeeds. Fix any TypeScript errors before proceeding.

- [ ] **Step 3: Smoke test locally**

```bash
npm run dev
```

Check manually:
- [ ] `/auth/sign-up` — can create an account with email/password
- [ ] `/auth/sign-in` — can sign in; name appears in header
- [ ] Generate a guide — Save button calls API (check Network tab: `POST /api/guides` returns 200)
- [ ] Refresh page — guides are still there (loaded from DB, not localStorage)
- [ ] Delete a guide — `DELETE /api/guides/[id]` returns 200
- [ ] Sign out — guides disappear (unauthenticated users see empty list)
- [ ] Try accessing `/api/guides` without auth in a new tab — should return 401

- [ ] **Step 4: Push**

```bash
git push
```

- [ ] **Step 5: Deploy to Vercel**

In Vercel project settings, add all environment variables from `.env.local`:
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Then trigger a deployment (push to main or click "Redeploy" in Vercel).

Update Google OAuth authorized redirect URIs to include the production URL: `https://your-app.vercel.app/api/auth/callback/google`.
