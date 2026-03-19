# Travel Planning Web Application — Hybrid Optimized Prompt

**Document type**: Unified specification — use this as your single source of truth
**Suitable for**: Stakeholder alignment, architectural review, daily development reference, and direct input to Claude API
**Version**: 1.0 (synthesized from Detailed, Concise, and Technical variants)

---

## 1. Executive Overview

Build a single-page web application that collects travel information through an interactive form, processes it through a two-stage Claude AI pipeline (Haiku → Sonnet), and delivers a structured, actionable travel guide. This is Phase 1 (MVP) of a multi-phase travel platform.

**What this document covers**: everything needed to build and ship the MVP — architecture, typed data models, AI pipeline configuration, UI/UX requirements, accessibility, testing strategy, documentation standards, and post-release process.

**Tech stack at a glance**: Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 · Anthropic SDK · Zod

---

## 2. Architecture & Technical Foundation

### 2.1 System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                        Browser (Client)                        │
│                                                               │
│  ┌──────────────────┐   POST    ┌──────────────────────────┐  │
│  │   TravelForm     │──────────▶│   /api/travel            │  │
│  │  (React, Zod)    │           │                          │  │
│  └────────┬─────────┘           │  1. Zod.parse(body)      │  │
│           │                     │  2. buildHaikuPrompt()   │  │
│  ┌────────▼─────────┐           │  3. Haiku → validate     │  │
│  │   TravelReport   │◀──JSON────│  4. buildSonnetPrompt()  │  │
│  │  (4 sections)    │           │  5. Sonnet → report      │  │
│  └──────────────────┘           │  6. Return typed JSON    │  │
│                                 └──────────┬───────────────┘  │
└─────────────────────────────────────────────┼─────────────────┘
                                              │
                              ┌───────────────┴────────────────┐
                              │                                │
                    ┌─────────▼──────┐             ┌──────────▼──────┐
                    │  Claude Haiku  │             │  Claude Sonnet  │
                    │  Validate &    │────output──▶│  Analyze &      │
                    │  Summarize     │             │  Generate       │
                    └────────────────┘             └─────────────────┘
```

### 2.2 Data Flow

```
FormData (Zod-validated)
  │
  ▼
POST /api/travel
  ├─▶ Zod.parse(body) ──[fail]──────────────────────▶ 400 VALIDATION_ERROR
  │
  ├─▶ buildHaikuPrompt(formData)
  │     └─▶ Haiku API call (temp: 0, max_tokens: 500)
  │           ├─▶ JSON.parse(response) ──[fail]────▶ 500 AI_ERROR
  │           └─▶ haiku.valid === false ────────────▶ 422 INVALID_DESTINATION
  │
  ├─▶ buildSonnetPrompt(formData, haikuOutput)
  │     └─▶ Sonnet API call (temp: 0.7, max_tokens: 4000)
  │           └─▶ JSON.parse(response) ──[fail]────▶ 500 AI_ERROR
  │
  └─▶ 200 { success: true, report: TravelReport }
```

### 2.3 Project File Structure

```
src/
├── app/
│   ├── page.tsx                  # Root page — renders TravelForm or TravelReport
│   ├── layout.tsx                # HTML shell, metadata, fonts
│   └── api/
│       └── travel/
│           └── route.ts          # POST handler (Haiku → Sonnet pipeline)
├── components/
│   ├── TravelForm/
│   │   ├── index.tsx             # Form orchestrator, submit handler
│   │   ├── DateSection.tsx
│   │   ├── DestinationSection.tsx
│   │   ├── AccommodationSection.tsx
│   │   ├── GroupSection.tsx
│   │   └── PreferencesSection.tsx
│   └── TravelReport/
│       ├── index.tsx             # Report layout orchestrator
│       ├── SafetyBanner.tsx      # Color-coded safety status (accessible)
│       ├── Attractions.tsx
│       ├── Cuisine.tsx
│       └── PracticalInfo.tsx
├── lib/
│   ├── schemas.ts                # Zod schemas (shared front/back)
│   ├── anthropic.ts              # Anthropic client singleton
│   └── prompts.ts                # Haiku and Sonnet prompt builders
└── types/
    └── travel.ts                 # All TypeScript interfaces
```

### 2.4 TypeScript Interfaces

```typescript
// src/types/travel.ts

// ── Form ──────────────────────────────────────────────────────

export interface TravelFormData {
  destination: string;
  departureDate: string;           // ISO 8601: YYYY-MM-DD
  returnDate: string;
  accommodation: {
    booked: boolean;
    preferences?: AccommodationType[];
  };
  group: {
    adults: number;                // 1–20
    children: number;              // 0–20
    type: GroupType;
  };
  preferences: TravelPreference[];
}

export type GroupType = "Family" | "Friends" | "Solo" | "Couple" | "Business";

export type TravelPreference =
  | "Nature" | "Architecture" | "Entertainment" | "Food"
  | "Adventure" | "Art" | "Shopping" | "Wellness" | "LocalExperiences";

export type AccommodationType =
  | "Hotel" | "Airbnb" | "Hostel" | "Resort" | "BedAndBreakfast";

// ── Haiku output ──────────────────────────────────────────────

export interface HaikuOutput {
  valid: boolean;
  reason?: string;
  travelProfile?: string;
  extractedParams?: {
    tripDurationDays: number;
    season: string;
    groupContext: string;
    primaryInterests: string[];
  };
  concerns?: string[];
}

// ── Travel Report ─────────────────────────────────────────────

export interface TravelReport {
  safety: SafetyStatus;
  attractions: Attraction[];
  cuisine: CuisineReport;
  practical: PracticalInfo;
}

export type SafetyLevel = "RED" | "ORANGE" | "GREEN";

export interface SafetyStatus {
  level: SafetyLevel;
  headline: string;               // e.g., "Exercise Caution"
  summary: string;                // 2–3 sentences
  specificRisks: string[];
}

export interface Attraction {
  name: string;
  category: string;
  priceLevel: "FREE" | "BUDGET" | "MODERATE" | "EXPENSIVE";
  priceNote: string;              // e.g., "€15/adult" or "Free entry"
  description: string;            // 2–3 sentences: why visit
  tips: string[];                 // 2–3 practical tips
  relevantFor: string[];          // Which TravelPreference values this serves
}

export interface CuisineReport {
  mustTryDishes: {
    name: string;
    description: string;
    whereToFind: string;
  }[];                            // 5–7 dishes
  restaurantCategories: {
    type: string;
    priceRange: string;           // e.g., "€5–€15 per meal"
    description: string;
    recommendation?: string;
  }[];
  dietaryConsiderations: {
    vegetarianFriendly: boolean;
    veganOptions: boolean;
    halalAvailable: boolean;
    kosherAvailable: boolean;
    commonAllergens: string[];
    notes: string;
  };
  diningCustoms: string[];
  tippingGuidance: string;
}

export interface PracticalInfo {
  currency: {
    name: string;
    code: string;
    exchangeTip: string;
    cashVsCard: string;
  };
  transportation: {
    drivingSide: "left" | "right";
    internationalLicenseRequired: boolean;
    publicTransportSummary: string;
    taxiRideshareApps: string[];
  };
  electrical: {
    voltage: string;              // e.g., "220V / 50Hz"
    plugTypes: string[];          // e.g., ["Type C", "Type F"]
    adapterNeeded: boolean;
  };
  language: {
    official: string[];
    englishWidelySpoken: boolean;
    usefulPhrases: { phrase: string; translation: string }[];
  };
  weather: {
    currentSeason: string;
    expectedConditions: string;
    packingTips: string[];
    bestSeasons: string;
    avoidSeasons?: string;
  };
  emergency: {
    policeNumber: string;
    ambulanceNumber: string;
    touristPolice?: string;
    embassyTip: string;
  };
  visa: {
    requiredForCommonPassports: string;
    processingNote: string;
  };
  culturalCustoms: string[];
}

// ── API ───────────────────────────────────────────────────────

export type ApiResponse =
  | { success: true; report: TravelReport }
  | { success: false; error: string; code: ApiErrorCode };

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_DESTINATION"
  | "AI_ERROR"
  | "RATE_LIMIT"
  | "TIMEOUT";
```

### 2.5 Zod Validation Schema

```typescript
// src/lib/schemas.ts
import { z } from "zod";

const today = new Date().toISOString().split("T")[0];

export const TravelFormSchema = z
  .object({
    destination: z.string().min(2).max(100),
    departureDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
      .refine((d) => d >= today, "Departure must be today or later"),
    returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    accommodation: z.object({
      booked: z.boolean(),
      preferences: z
        .array(z.enum(["Hotel", "Airbnb", "Hostel", "Resort", "BedAndBreakfast"]))
        .optional(),
    }),
    group: z.object({
      adults: z.number().int().min(1).max(20),
      children: z.number().int().min(0).max(20),
      type: z.enum(["Family", "Friends", "Solo", "Couple", "Business"]),
    }),
    preferences: z
      .array(
        z.enum([
          "Nature", "Architecture", "Entertainment", "Food",
          "Adventure", "Art", "Shopping", "Wellness", "LocalExperiences",
        ])
      )
      .min(1, "Select at least one preference"),
  })
  .refine(
    (data) => data.returnDate > data.departureDate,
    { message: "Return date must be after departure date", path: ["returnDate"] }
  );
```

---

## 3. MVP Features — Implementation Details

### 3.1 Form Input Specification

| Field | Input Type | Validation | Notes |
|---|---|---|---|
| Destination | Text | Min 2 chars, max 100 | Autocomplete optional in Phase 2 |
| Departure date | Date picker | ≥ today | ISO 8601 output |
| Return date | Date picker | > departure date | Show duration hint |
| Accommodation booked | Toggle (boolean) | Required | Reveal preferences if false |
| Accommodation prefs | Multi-select | Optional | Hotel, Airbnb, Hostel, Resort, B&B |
| Adults | Number | 1–20, integer | Default: 1 |
| Children | Number | 0–20, integer | Default: 0 |
| Group type | Radio | Required, single select | Family / Friends / Solo / Couple / Business |
| Preferences | Checkbox grid | Min 1 selected | Nature, Architecture, Entertainment, Food, Adventure, Art, Shopping, Wellness, Local Experiences |

**Form behavior**:
- Validate on submit only (not on blur — avoids interrupting input flow)
- Show field-level error messages inline below each input
- Disable submit button while loading
- "Start Over" button resets both form and displayed report

### 3.2 AI Processing Pipeline

#### Stage 1 — Claude Haiku: Validate & Summarize

```typescript
// src/lib/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";
export const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env
```

```typescript
// src/lib/prompts.ts
import type { TravelFormData, HaikuOutput } from "@/types/travel";

export function buildHaikuPrompt(data: TravelFormData): string {
  return `You are a travel data validator. Analyze this travel request and respond with valid JSON only — no markdown, no explanation.

Input:
${JSON.stringify(data, null, 2)}

Respond with exactly this JSON structure:
{
  "valid": boolean,
  "reason": "string — only set if valid is false",
  "travelProfile": "string — 1 paragraph summary, only set if valid is true",
  "extractedParams": {
    "tripDurationDays": number,
    "season": "string",
    "groupContext": "string",
    "primaryInterests": ["string"]
  },
  "concerns": ["string"]
}

Rules:
- Set valid=false if the destination is not a real, recognizable place
- Set valid=false if date logic is impossible
- concerns may be an empty array
- Respond with raw JSON only`;
}
```

**Haiku API call config**:
- Model: `claude-haiku-4-5-20251001`
- `temperature: 0` — deterministic output ensures the same input always produces the same validation result; flakiness here would cause inconsistent UX
- `max_tokens: 500`

#### Stage 2 — Claude Sonnet: Analyze & Generate

```typescript
export function buildSonnetPrompt(data: TravelFormData, haiku: HaikuOutput): string {
  return `You are an expert travel advisor. Generate a comprehensive, personalized travel report as JSON.

Travel profile: ${haiku.travelProfile}
Trip parameters: ${JSON.stringify(haiku.extractedParams)}
Concerns to address: ${haiku.concerns?.join(", ") || "none"}
Original request: ${JSON.stringify(data)}

Generate a complete TravelReport JSON matching this TypeScript interface exactly:

interface TravelReport {
  safety: {
    level: "RED" | "ORANGE" | "GREEN";
    headline: string;
    summary: string;
    specificRisks: string[];
  };
  attractions: Array<{
    name: string;
    category: string;
    priceLevel: "FREE" | "BUDGET" | "MODERATE" | "EXPENSIVE";
    priceNote: string;
    description: string;
    tips: string[];
    relevantFor: string[];
  }>;
  cuisine: {
    mustTryDishes: Array<{ name: string; description: string; whereToFind: string }>;
    restaurantCategories: Array<{
      type: string;
      priceRange: string;
      description: string;
      recommendation?: string;
    }>;
    dietaryConsiderations: {
      vegetarianFriendly: boolean;
      veganOptions: boolean;
      halalAvailable: boolean;
      kosherAvailable: boolean;
      commonAllergens: string[];
      notes: string;
    };
    diningCustoms: string[];
    tippingGuidance: string;
  };
  practical: {
    currency: { name: string; code: string; exchangeTip: string; cashVsCard: string };
    transportation: {
      drivingSide: "left" | "right";
      internationalLicenseRequired: boolean;
      publicTransportSummary: string;
      taxiRideshareApps: string[];
    };
    electrical: { voltage: string; plugTypes: string[]; adapterNeeded: boolean };
    language: {
      official: string[];
      englishWidelySpoken: boolean;
      usefulPhrases: Array<{ phrase: string; translation: string }>;
    };
    weather: {
      currentSeason: string;
      expectedConditions: string;
      packingTips: string[];
      bestSeasons: string;
      avoidSeasons?: string;
    };
    emergency: {
      policeNumber: string;
      ambulanceNumber: string;
      touristPolice?: string;
      embassyTip: string;
    };
    visa: { requiredForCommonPassports: string; processingNote: string };
    culturalCustoms: string[];
  };
}

Requirements:
- Include 8–12 attractions tailored to preferences: ${data.preferences.join(", ")}
- Consider group type (${data.group.type}) and composition
- Safety level must reflect real-world current conditions
- Include 5–7 must-try dishes in cuisine
- Respond with raw JSON only — no markdown, no preamble`;
}
```

**Sonnet API call config**:
- Model: `claude-sonnet-4-6`
- `temperature: 0.7` — allows creative, varied recommendations while remaining coherent; lower values produce generic output
- `max_tokens: 4000`

### 3.3 API Route Implementation

```typescript
// src/app/api/travel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { TravelFormSchema } from "@/lib/schemas";
import { buildHaikuPrompt, buildSonnetPrompt } from "@/lib/prompts";
import type { ApiResponse, HaikuOutput } from "@/types/travel";

function extractText(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}

function safeParseJSON<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Retry: strip markdown code fences if model wrapped output
    const stripped = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(stripped) as T;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const parsed = TravelFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.message, code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  try {
    // Stage 1: Haiku — validate
    const haikuResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      temperature: 0,
      messages: [{ role: "user", content: buildHaikuPrompt(parsed.data) }],
    });
    const haiku = safeParseJSON<HaikuOutput>(extractText(haikuResponse));

    if (!haiku.valid) {
      return NextResponse.json(
        { success: false, error: haiku.reason ?? "Destination not recognized", code: "INVALID_DESTINATION" },
        { status: 422 }
      );
    }

    // Stage 2: Sonnet — generate
    const sonnetResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: "user", content: buildSonnetPrompt(parsed.data, haiku) }],
    });
    const report = safeParseJSON(extractText(sonnetResponse));

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error("[/api/travel]", err);
    return NextResponse.json(
      { success: false, error: "AI processing failed. Please try again.", code: "AI_ERROR" },
      { status: 500 }
    );
  }
}
```

---

## 4. Output Sections — Complete Specification

### 4.1 Safety & Security Status

**Data**: `SafetyStatus` interface (see §2.4)

**Rendering rules**:

| Level | Visual treatment | Behavior |
|---|---|---|
| 🔴 RED | Full-width red banner at top of page | Show warning before rest of report; require explicit "I understand the risks, continue" acknowledgment |
| 🟠 ORANGE | Orange banner at top | Visible caution; user can scroll directly to report |
| 🟢 GREEN | Small green badge beside destination name | Understated; does not interrupt report flow |

**Accessibility**: Never rely on color alone. Always render: emoji + text label + written status.
```
🔴 RED — High Risk: Active conflict reported in this region.
```

### 4.2 Attractions & Points of Interest

- Return **8–12 items**, filtered and ranked by the user's selected preferences
- Each item includes: name, category, price level + note, 2–3 sentence description, 2–3 tips, and which preferences it serves
- Group family-friendly attractions first when `group.type === "Family"` or `group.children > 0`
- Display as a card grid (2 columns on tablet, 3 on desktop)

### 4.3 Local Cuisine & Dining

- **5–7 must-try dishes** with description and where to find them
- **Restaurant categories** with price ranges in local currency
- **Dietary considerations** table (vegetarian/vegan/halal/kosher flags + allergens)
- **Dining customs** as a bullet list
- **Tipping guidance** as a single, clear sentence

### 4.4 Essential Practical Information

Render as a scannable reference grid with labeled cards:

| Card | Key fields |
|---|---|
| Currency | Name, code, exchange tip, cash vs. card |
| Transport | Driving side, license, transit summary, apps |
| Electrical | Voltage, plug types, adapter needed |
| Language | Official languages, English prevalence, 5 phrases |
| Weather | Season, conditions, packing tips |
| Emergency | Police, ambulance, tourist police, embassy tip |
| Visa | Requirements, processing note |
| Culture | Bullet list of customs |

---

## 5. Design & User Experience

### 5.1 Visual Design

- **Colors**: Blues/teals for primary actions (trust, travel); amber for warnings; red for danger; green for safe
- **Typography**: Inter or Geist; heading hierarchy h1 → h4; body text min 16px
- **Spacing**: 8px base unit; 24–32px between sections
- **Cards**: 8–12px border radius; subtle shadow; hover state on attraction cards
- **Max content width**: 1200px, centered

### 5.2 Responsive Breakpoints

| Viewport | Form layout | Report layout |
|---|---|---|
| Mobile (< 768px) | Single column | Single column |
| Tablet (768–1024px) | 2-column grid | 2-column grid |
| Desktop (> 1024px) | 3-column grid | 3-column practical info grid |

### 5.3 Loading States

Show a two-step progress indicator while the API route processes:

```
Step 1 of 2: Validating your travel details...  (~2s)
Step 2 of 2: Generating your personalized guide...  (~10–15s)
```

- Display skeleton loaders for each report section during Step 2
- Show "This usually takes 10–15 seconds" to set expectations

### 5.4 Error States

| Error code | User-facing message |
|---|---|
| `VALIDATION_ERROR` | Field-level inline messages (e.g., "Return date must be after departure") |
| `INVALID_DESTINATION` | "We couldn't find this destination. Try a more specific city or country name." |
| `AI_ERROR` | "Something went wrong generating your guide. Please try again." |
| `RATE_LIMIT` | "Too many requests — please wait a moment and try again." |
| `TIMEOUT` | "The request took too long. Please try again." |

### 5.5 Accessibility

**Form inputs**:
- Every input has an associated `<label>` (never `placeholder` as the only label)
- Error messages linked via `aria-describedby`
- Logical tab order matches visual order

**AI-powered loading states** — ARIA live region:
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {loadingStep === 1 && "Validating your travel information..."}
  {loadingStep === 2 && "Generating personalized recommendations..."}
  {!loading && report && "Your travel guide is ready."}
</div>
```

**Safety status** — screen readers:
```tsx
<div role="alert" aria-label={`Safety level: ${safety.level}. ${safety.headline}`}>
  {/* Visual: emoji + colored badge + headline */}
</div>
```

**General**:
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text
- Focus ring visible on all interactive elements
- Color is never the sole indicator of meaning (safety levels include emoji, text label, and written description)
- Keyboard navigable throughout — no mouse-only interactions

---

## 6. Technical Implementation

### 6.1 Error Handling Matrix

| Scenario | HTTP | Code | Retry? | Notes |
|---|---|---|---|---|
| Malformed request body | 400 | `VALIDATION_ERROR` | No — fix input | Zod message returned |
| Destination unrecognized | 422 | `INVALID_DESTINATION` | No — fix input | Haiku flagged it |
| Anthropic rate limit | 429 | `RATE_LIMIT` | Yes, after delay | Surface retry guidance |
| JSON parse failure | 500 | `AI_ERROR` | Yes, once | `safeParseJSON` strips fences first |
| Anthropic service error | 500 | `AI_ERROR` | Yes | Log error server-side |
| Request timeout (>30s) | 504 | `TIMEOUT` | Yes | Set via `vercel.json` |

### 6.2 Performance Targets

| Metric | Target | Notes |
|---|---|---|
| Haiku response time | < 3s | temperature: 0, low tokens |
| Sonnet response time | < 20s | P95 target |
| Total API route time | < 30s | Vercel function timeout |
| Form interaction | < 100ms | No perceptible lag |
| Report render | < 200ms | Data arrives parsed and typed |

**Future optimization**: Switch to `anthropic.messages.stream()` + `ReadableStream` response to stream Sonnet output to the client incrementally. Design loading state to accept incremental section data now so this migration is non-breaking.

### 6.3 Cost Estimation

| Call | Model | Approx. input tokens | Approx. output tokens | Cost/request |
|---|---|---|---|---|
| Haiku (validate) | claude-haiku-4-5-20251001 | ~300 | ~200 | ~$0.0003 |
| Sonnet (generate) | claude-sonnet-4-6 | ~800 | ~1500 | ~$0.015 |
| **Total** | | | | **~$0.015** |

At 1,000 requests/day → ~$15/day. Cache identical queries (same destination + dates + preferences hash) in Redis to reduce repeat costs at scale.

### 6.4 Testing Strategy

```
Unit (Jest):
├── src/lib/schemas.test.ts          — Zod edge cases, refine conditions
├── src/lib/prompts.test.ts          — Prompt builder output shape
└── src/lib/anthropic.test.ts        — safeParseJSON, extractText

Integration (Jest + fetch mock):
└── src/app/api/travel/route.test.ts
    ├── Valid request → 200, report matches TravelReport shape
    ├── Invalid body → 400 VALIDATION_ERROR
    ├── Bad destination → 422 INVALID_DESTINATION
    ├── Haiku JSON parse failure → 500 AI_ERROR
    └── Sonnet JSON parse failure → 500 AI_ERROR

E2E (Playwright):
└── tests/
    ├── happy-path.spec.ts           — Fill form → submit → report renders
    ├── validation.spec.ts           — Client-side form validation
    └── error-states.spec.ts         — API failure handling
```

### 6.5 Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...

# Future phases
# FLIGHT_API_KEY=
# HOTEL_API_KEY=
# REDIS_URL=
```

### 6.6 Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "src/app/api/**": {
      "maxDuration": 30
    }
  }
}
```

---

## 7. GitHub Documentation & Project Management

### 7.1 Required Documentation Files

Create all of the following at project root before the first commit:

| File | Purpose | Update cadence |
|---|---|---|
| `README.md` | Project overview, quick start, current status, roadmap link | Every release |
| `ARCHITECTURE.md` | System design, data flow diagrams, API spec, component map | Before major phases |
| `FEATURES.md` | All features by phase with status (Planned / In Progress / Done / On Hold) | Post-brainstorm |
| `INSTALLATION.md` | Prerequisites, env vars, local dev setup, troubleshooting | When setup changes |
| `API_INTEGRATION.md` | Claude model choices, prompt templates, cost estimates, error handling | When prompts change |
| `CONTRIBUTING.md` | Git workflow, branch naming, PR requirements, code style | Continuous |
| `CHANGELOG.md` | Version history, release notes, breaking changes | Every release |
| `ROADMAP.md` | 6–12 month plan, phase breakdown, milestones | Post-brainstorm |
| `DEPLOYMENT.md` | Vercel setup, env vars checklist, monitoring | When deploy changes |
| `SECURITY.md` | API key management, data privacy, vulnerability reporting | Quarterly review |

### 7.2 Branch Strategy

```
main          → Production-ready code only
develop       → Integration branch (merge features here first)
feature/[id]-description   → e.g., feature/42-attractions-card
fix/[id]-description       → e.g., fix/17-date-validation
```

### 7.3 Commit Convention

```
feat(api): add Haiku validation stage to travel route
fix(form): correct returnDate comparison in Zod refine
docs(arch): add data flow diagram for Haiku→Sonnet pipeline
test(api): add integration tests for INVALID_DESTINATION path
```

### 7.4 Pull Request Requirements

- Link to related GitHub issue
- Update `CHANGELOG.md` with entry
- Pass all tests and lint
- Request one code reviewer + one documentation reviewer (if docs changed)

### 7.5 Issue Templates

Create in `.github/ISSUE_TEMPLATE/`:
- `feature_request.md`
- `bug_report.md`
- `documentation.md`

---

## 8. Post-Release Process

### Step 1: Release Documentation (within 24 hours)

1. Update `CHANGELOG.md`: version, date, features, fixes, known issues, contributors
2. Update `README.md`: current version badge, latest feature highlights
3. Tag release: `git tag v0.x.0 && git push --tags`
4. Create GitHub Release with CHANGELOG excerpt

### Step 2: Post-Release Brainstorming Session (within 1 week)

**Participants**: Developers, PM, UX designer, stakeholders
**Duration**: 60–90 minutes

| Agenda item | Time |
|---|---|
| Release retrospective (what went well, what didn't, lessons) | 15 min |
| User feedback analysis (issues, patterns, feature requests) | 15 min |
| Metrics review (adoption, feature usage, error rates) | 10 min |
| Next steps brainstorming (prioritize, identify tech debt) | 30 min |
| Decision making (vote on focus, assign owners, set milestones) | 15 min |

**Output**: Meeting notes, prioritized feature list, updated roadmap draft

### Step 3: Documentation Update (within 2 weeks)

Update based on brainstorming outcomes:
- `ROADMAP.md`: adjust timelines, add prioritized features, reorganize phases
- `FEATURES.md`: new entries, status updates, moved items
- `ARCHITECTURE.md`: document any new architectural decisions
- `README.md`: updated roadmap section, phase indicators

Create next sprint planning document with: user stories, acceptance criteria, technical specs, resource allocation.

### Step 4: Communication & Visibility (ongoing)

- Create GitHub issues for prioritized features and link to brainstorming notes
- Update project board (Kanban) with new tasks and effort estimates
- Share brainstorm outcomes with team; clarify next sprint objectives
- Publish blog post or release announcement (key features, community thanks, upcoming preview)

### Documentation Maintenance Schedule

| Trigger | Documents to update |
|---|---|
| Every release | CHANGELOG, README, version tags |
| Post-brainstorm (2 weeks) | ROADMAP, FEATURES, sprint plan |
| Quarterly | Full documentation review |
| Before major phase | ARCHITECTURE, API_INTEGRATION |
| Ongoing | CONTRIBUTING (standards evolve) |

---

## 9. Future Scaling Roadmap

| Phase | Feature | Technical approach | Priority |
|---|---|---|---|
| 2 | Flight / train / bus search | Amadeus API or Rome2Rio; new `/api/transport` route | High |
| 3 | Accommodation booking | Booking.com Affiliate API; `/api/accommodation` route | High |
| 4 | Local transit schedules | City GTFS data feeds; per-destination integration | Medium |
| 5 | Itinerary builder + calendar | Drag-and-drop (dnd-kit); `ical` package for .ics export | Medium |
| 6 | Budget calculator | Exchange rates (frankfurter.app) + per-category cost DB | Low |
| 6 | Currency converter | Embedded in practical info section; real-time rates | Low |
| 6 | Packing list generator | Derived from destination + season + preferences | Low |
| 7 | Travel insurance comparison | Partner API (e.g., InsureMyTrip) | Future |

**Streaming upgrade path (Phase 2 optimization)**: Switch `/api/travel` to use `anthropic.messages.stream()` and return a `ReadableStream` response. The frontend loading state should be designed from MVP to handle incremental section delivery — this makes the migration a frontend-only change.

---

## 10. Success Criteria & Metrics

### MVP Launch Checklist

- [ ] Form collects all required fields with validation
- [ ] Haiku correctly rejects invalid/non-existent destinations
- [ ] Sonnet generates all 4 report sections with correct data shape
- [ ] Safety RED level shows blocking warning before report
- [ ] Loading states announce progress to screen readers
- [ ] All error codes surface user-friendly messages
- [ ] Report renders correctly on mobile, tablet, and desktop
- [ ] `ANTHROPIC_API_KEY` configured in production environment
- [ ] All 10 GitHub documentation files exist and are populated
- [ ] Vercel function timeout set to 30s

### Performance Targets

- Haiku response: < 3s (P95)
- Sonnet response: < 20s (P95)
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Accessibility: WCAG 2.1 AA compliance

### Quality Metrics (post-launch)

- Report JSON parse success rate: > 99%
- INVALID_DESTINATION false-positive rate: < 2%
- User session completion rate (form → full report): > 70%
- Error rate per 1,000 requests: < 10

---

## 11. Critical Implementation Notes

### 1. Always request JSON from AI models

Both prompts explicitly instruct the model to return raw JSON with no markdown. Add `safeParseJSON()` (see §3.3) as a defensive fallback that strips code fences before parsing — models occasionally wrap output in `` ```json `` despite instructions.

### 2. Temperature settings are not optional

| Model | Temperature | Why |
|---|---|---|
| Haiku | `0` | Validation must be deterministic — the same destination should always get the same valid/invalid judgment |
| Sonnet | `0.7` | Recommendations should feel personalized and varied, not formulaic. Values below 0.5 produce noticeably generic output. |

### 3. The Sonnet prompt must embed the full TravelReport interface

Do not use placeholders. The complete interface is in `buildSonnetPrompt()` in §3.2. If you modify the TypeScript interfaces in `src/types/travel.ts`, update the embedded interface in the prompt simultaneously — they must stay in sync.

### 4. Prompt versioning

As you iterate prompt wording, version them (`HAIKU_PROMPT_V1`, `HAIKU_PROMPT_V2`) and log which version was active when a report was generated. This makes quality regressions diagnosable. Store version identifiers as constants in `src/lib/prompts.ts`.

### 5. Type-check Sonnet output at the API boundary

The current route uses `safeParseJSON` but does not validate the shape of Sonnet's response against the `TravelReport` interface at runtime. In production, run the parsed JSON through a Zod schema for `TravelReport` before returning it. This prevents malformed AI output from crashing the UI in edge cases.

### 6. Keep prompts in `src/lib/prompts.ts`

Both prompt builders are pure functions that take typed inputs and return strings. This makes them independently testable, version-controlled, and easy to iterate without touching API route logic.

---

## 12. Quick Reference Tables

### Form Fields Summary

| Field | Type | Required | Default | Constraint |
|---|---|---|---|---|
| destination | string | Yes | — | 2–100 chars |
| departureDate | date string | Yes | — | ≥ today |
| returnDate | date string | Yes | — | > departureDate |
| accommodation.booked | boolean | Yes | — | — |
| accommodation.preferences | string[] | No | — | Only if booked=false |
| group.adults | integer | Yes | 1 | 1–20 |
| group.children | integer | Yes | 0 | 0–20 |
| group.type | enum | Yes | — | Family/Friends/Solo/Couple/Business |
| preferences | string[] | Yes | — | Min 1 of 9 options |

### API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/travel` | None (MVP) | Submit form → get travel report |

### Safety Level Color Coding

| Level | Color | Meaning | Report behavior |
|---|---|---|---|
| 🔴 RED | Red | High danger (war, disaster, crisis) | Block report; require acknowledgment |
| 🟠 ORANGE | Amber | Moderate risk (political tension, seasonal hazard) | Show banner; allow scrolling |
| 🟢 GREEN | Green | Safe, recommended | Small badge; no interruption |

### Phase Deliverables

| Phase | Key deliverable | New dependencies |
|---|---|---|
| 1 (MVP) | Form + AI pipeline + travel report | Anthropic SDK |
| 2 | Transport search | Amadeus or Rome2Rio API |
| 3 | Accommodation search | Booking.com Affiliate API |
| 4 | Local transit | GTFS data feeds |
| 5 | Itinerary + calendar export | dnd-kit, ical |
| 6 | Budget + currency + packing | frankfurter.app |
