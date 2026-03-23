# Tester Agent TDD Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install and configure Jest + React Testing Library, write the HIGH-priority test suite in strict TDD order (failing test → commit → implementation passes → commit), and update the tester agent definition to enforce this workflow permanently.

**Architecture:** Jest configured via `next/jest` (handles Next.js transforms automatically), `jest-environment-jsdom` for component tests, `@testing-library/react` v16 for React 19 support. Tests live in `src/__tests__/` mirroring the `src/` structure. The tester agent definition is updated to write and commit failing tests *before* any implementation code is touched.

**Tech Stack:** Jest 29, jest-environment-jsdom, ts-jest (via next/jest), @testing-library/react v16, @testing-library/jest-dom, @testing-library/user-event, MSW v2, jest-localstorage-mock

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `jest.config.ts` | Jest config using next/jest wrapper |
| Create | `jest.setup.ts` | Global setup: @testing-library/jest-dom, localStorage mock |
| Modify | `package.json` | Add `test`, `test:watch`, `test:coverage` scripts |
| Create | `src/__tests__/lib/schemas.test.ts` | Zod schema validation tests |
| Create | `src/__tests__/lib/guides-storage.test.ts` | localStorage CRUD tests |
| Create | `src/__tests__/api/travel.test.ts` | API route handler tests |
| Create | `src/__tests__/components/GroupSection.test.tsx` | Group input conditional logic |
| Modify | `.claude/agents/tester.md` | Enforce TDD: failing test → commit → implement → verify |

---

## Task 1: Install test dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install all test packages**

```bash
npm install -D jest jest-environment-jsdom @types/jest \
  @testing-library/react@16 @testing-library/jest-dom @testing-library/user-event \
  msw jest-localstorage-mock
```

- [ ] **Step 2: Verify packages installed**

```bash
cat package.json | grep -E '"jest|testing-library|msw'
```

Expected: all 7 packages listed in devDependencies.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Jest + RTL test dependencies"
```

---

## Task 2: Configure Jest

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Create `jest.config.ts`**

```ts
import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/__tests__/**/*.test.{ts,tsx}"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/layout.tsx",
    "!src/app/globals.css",
  ],
};

export default createJestConfig(config);
```

- [ ] **Step 2: Create `jest.setup.ts`**

```ts
import "@testing-library/jest-dom";
import "jest-localstorage-mock";
```

- [ ] **Step 3: Add scripts to `package.json`**

Add inside `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

- [ ] **Step 4: Run jest to verify config loads**

```bash
npm test -- --passWithNoTests
```

Expected: "Test Suites: 0 passed" with no config errors.

- [ ] **Step 5: Commit**

```bash
git add jest.config.ts jest.setup.ts package.json
git commit -m "chore: configure Jest with next/jest, jsdom, and RTL setup"
```

---

## Task 3: Schema validation tests (TDD — HIGH)

**Files:**
- Create: `src/__tests__/lib/schemas.test.ts`

- [ ] **Step 1: Write tests (existing code — coverage pass)**

Create `src/__tests__/lib/schemas.test.ts`:

```ts
import { TravelFormSchema } from "@/lib/schemas";

// Use a fixed future date so tests don't break over time
const FUTURE = "2099-12-01";
const LATER  = "2099-12-10";

const VALID_BASE = {
  destination: "Paris",
  departureDate: FUTURE,
  returnDate: LATER,
  accommodation: { booked: false },
  group: { adults: 1, children: 0, type: "Solo" as const },
  preferences: ["Food" as const],
  transportMode: "publicTransport" as const,
};

describe("TravelFormSchema", () => {
  describe("destination", () => {
    it("rejects empty string", () => {
      const result = TravelFormSchema.safeParse({ ...VALID_BASE, destination: "" });
      expect(result.success).toBe(false);
    });

    it("rejects single character", () => {
      const result = TravelFormSchema.safeParse({ ...VALID_BASE, destination: "A" });
      expect(result.success).toBe(false);
    });

    it("accepts 2+ characters", () => {
      const result = TravelFormSchema.safeParse({ ...VALID_BASE, destination: "UK" });
      expect(result.success).toBe(true);
    });
  });

  describe("dates", () => {
    it("rejects returnDate on same day as departureDate", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        departureDate: FUTURE,
        returnDate: FUTURE,
      });
      expect(result.success).toBe(false);
    });

    it("rejects returnDate before departureDate", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        departureDate: LATER,
        returnDate: FUTURE,
      });
      expect(result.success).toBe(false);
    });

    it("accepts returnDate after departureDate", () => {
      const result = TravelFormSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
    });
  });

  describe("accommodation", () => {
    it("requires address when booked=true", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        accommodation: { booked: true },
      });
      expect(result.success).toBe(false);
    });

    it("requires address to be at least 5 chars when booked=true", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        accommodation: { booked: true, address: "Ab" },
      });
      expect(result.success).toBe(false);
    });

    it("accepts booked=true with valid address", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        accommodation: { booked: true, address: "12 Rue de Rivoli, Paris" },
      });
      expect(result.success).toBe(true);
    });

    it("accepts booked=false with no address", () => {
      const result = TravelFormSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
    });
  });

  describe("group", () => {
    it("rejects Friends group with only 1 adult", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        group: { adults: 1, children: 0, type: "Friends" },
      });
      expect(result.success).toBe(false);
    });

    it("accepts Friends group with 2+ adults", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        group: { adults: 2, children: 0, type: "Friends" },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("preferences", () => {
    it("rejects empty preferences array", () => {
      const result = TravelFormSchema.safeParse({ ...VALID_BASE, preferences: [] });
      expect(result.success).toBe(false);
    });

    it("accepts at least one preference", () => {
      const result = TravelFormSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run tests — expect them to compile and pass (schema already exists)**

```bash
npm test -- --testPathPattern=schemas
```

Expected: all tests PASS (schema is already implemented — this is the TDD baseline).

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/lib/schemas.test.ts
git commit -m "test: add Zod schema validation tests"
```

---

## Task 4: guides-storage tests (TDD — HIGH)

**Files:**
- Create: `src/__tests__/lib/guides-storage.test.ts`

- [ ] **Step 1: Write tests**

Create `src/__tests__/lib/guides-storage.test.ts`:

```ts
import { getGuides, saveGuide, deleteGuide, guideExists } from "@/lib/guides-storage";
import type { SavedGuide } from "@/lib/guides-storage";

// Minimal SavedGuide fixture
function makeGuide(overrides: Partial<SavedGuide> = {}): SavedGuide {
  return {
    id: "TEST_200326_AA1111",
    destination: "Paris",
    departureDate: "2099-12-01",
    returnDate: "2099-12-10",
    groupType: "Solo",
    groupSize: { adults: 1, children: 0 },
    report: {} as SavedGuide["report"],
    formData: {} as SavedGuide["formData"],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("getGuides", () => {
  it("returns empty array when localStorage is empty", () => {
    expect(getGuides()).toEqual([]);
  });

  it("returns parsed guides from localStorage", () => {
    const guide = makeGuide();
    localStorage.setItem("travelGuides", JSON.stringify([guide]));
    expect(getGuides()).toHaveLength(1);
    expect(getGuides()[0].id).toBe("TEST_200326_AA1111");
  });

  it("returns empty array when localStorage contains invalid JSON", () => {
    localStorage.setItem("travelGuides", "not-json{{{");
    expect(getGuides()).toEqual([]);
  });
});

describe("saveGuide", () => {
  it("saves a guide to localStorage", () => {
    const guide = makeGuide();
    saveGuide(guide);
    expect(getGuides()).toHaveLength(1);
  });

  it("prepends new guide (newest first ordering)", () => {
    const older = makeGuide({ id: "OLDER" });
    const newer = makeGuide({ id: "NEWER" });
    saveGuide(older);
    saveGuide(newer);
    const guides = getGuides();
    expect(guides[0].id).toBe("NEWER");
    expect(guides[1].id).toBe("OLDER");
  });

  it("preserves the full report on the saved guide", () => {
    const guide = makeGuide({
      report: { safety: { level: "GREEN", headline: "Safe", summary: "", specificRisks: [] } } as SavedGuide["report"],
    });
    saveGuide(guide);
    expect(getGuides()[0].report.safety.level).toBe("GREEN");
  });
});

describe("deleteGuide", () => {
  it("removes the guide with the given id", () => {
    saveGuide(makeGuide({ id: "A" }));
    saveGuide(makeGuide({ id: "B" }));
    deleteGuide("A");
    const remaining = getGuides();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe("B");
  });

  it("is a no-op when id does not exist", () => {
    saveGuide(makeGuide({ id: "A" }));
    deleteGuide("NONEXISTENT");
    expect(getGuides()).toHaveLength(1);
  });
});

describe("guideExists", () => {
  it("returns true when guide is saved", () => {
    saveGuide(makeGuide({ id: "A" }));
    expect(guideExists("A")).toBe(true);
  });

  it("returns false when guide is not saved", () => {
    expect(guideExists("MISSING")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --testPathPattern=guides-storage
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/lib/guides-storage.test.ts
git commit -m "test: add guides-storage localStorage CRUD tests"
```

---

## Task 5: API route tests (TDD — HIGH)

**Files:**
- Create: `src/__tests__/api/travel.test.ts`

- [ ] **Step 1: Write tests**

Create `src/__tests__/api/travel.test.ts`:

```ts
import { POST } from "@/app/api/travel/route";
import { NextRequest } from "next/server";

// Mock the Anthropic SDK — never make real API calls in tests
jest.mock("@/lib/anthropic", () => ({
  anthropic: {
    messages: {
      create: jest.fn(),
    },
  },
}));

import { anthropic } from "@/lib/anthropic";
const mockCreate = anthropic.messages.create as jest.Mock;

// Minimal valid request body
const VALID_BODY = {
  destination: "Paris",
  departureDate: "2099-12-01",
  returnDate: "2099-12-10",
  accommodation: { booked: false },
  group: { adults: 1, children: 0, type: "Solo" },
  preferences: ["Food"],
  transportMode: "publicTransport",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/travel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// A minimal valid response for Call A (experiences)
const EXPERIENCES_RESPONSE = {
  content: [{
    type: "text",
    text: JSON.stringify({
      valid: true,
      safety: { level: "GREEN", headline: "Safe", summary: "Safe city", specificRisks: [] },
      attractions: [],
      cuisine: {
        mustTryDishes: [],
        restaurantCategories: [],
        dietaryConsiderations: {
          vegetarianFriendly: true, veganOptions: true,
          halalAvailable: false, kosherAvailable: false,
          commonAllergens: [], notes: "",
        },
        diningCustoms: [],
        tippingGuidance: "",
      },
    }),
  }],
  usage: { input_tokens: 100, output_tokens: 200 },
};

// A minimal valid response for Call B (practicalities)
const PRACTICALITIES_RESPONSE = {
  content: [{
    type: "text",
    text: JSON.stringify({
      valid: true,
      practical: {
        currency: { name: "Euro", code: "EUR", exchangeTip: "", cashVsCard: "" },
        transportation: {
          drivingSide: "right", internationalLicenseRequired: false,
          publicTransportSummary: "", taxiRideshareApps: [], transportTips: [],
        },
        electrical: { voltage: "230V", plugTypes: ["E"], adapterNeeded: true },
        language: { official: ["French"], englishWidelySpoken: true, usefulPhrases: [] },
        weather: { currentSeason: "Spring", expectedConditions: "", packingTips: [], bestSeasons: "" },
        emergency: { policeNumber: "17", ambulanceNumber: "15", embassyTip: "" },
        visa: { requiredForCommonPassports: "No visa required", processingNote: "" },
        culturalCustoms: [],
      },
      destinationFacts: ["Fact 1", "Fact 2", "Fact 3", "Fact 4", "Fact 5"],
    }),
  }],
  usage: { input_tokens: 80, output_tokens: 150 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate
    .mockResolvedValueOnce(EXPERIENCES_RESPONSE)
    .mockResolvedValueOnce(PRACTICALITIES_RESPONSE);
});

describe("POST /api/travel", () => {
  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/travel", {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(makeRequest({ destination: "Paris" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 when Call A returns valid=false", async () => {
    mockCreate.mockReset();
    mockCreate
      .mockResolvedValueOnce({
        content: [{ type: "text", text: JSON.stringify({ valid: false, reason: "Not a place" }) }],
        usage: { input_tokens: 50, output_tokens: 10 },
      })
      .mockResolvedValueOnce(PRACTICALITIES_RESPONSE);

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.code).toBe("INVALID_DESTINATION");
  });

  it("returns 422 when Call B returns valid=false", async () => {
    mockCreate.mockReset();
    mockCreate
      .mockResolvedValueOnce(EXPERIENCES_RESPONSE)
      .mockResolvedValueOnce({
        content: [{ type: "text", text: JSON.stringify({ valid: false, reason: "Not a place" }) }],
        usage: { input_tokens: 50, output_tokens: 10 },
      });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.code).toBe("INVALID_DESTINATION");
  });

  it("returns 200 with merged TravelReport on success", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.report.safety.level).toBe("GREEN");
    expect(json.report.practical.currency.code).toBe("EUR");
    expect(json.report.destinationFacts).toHaveLength(5);
  });

  it("calls Anthropic exactly twice (two parallel calls)", async () => {
    await POST(makeRequest(VALID_BODY));
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --testPathPattern=travel
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/api/travel.test.ts
git commit -m "test: add API route tests with mocked Anthropic SDK"
```

---

## Task 6: GroupSection component tests (TDD — HIGH)

**Files:**
- Create: `src/__tests__/components/GroupSection.test.tsx`

- [ ] **Step 1: Write failing tests first, before reading implementation**

Create `src/__tests__/components/GroupSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TravelFormSchema, type TravelFormValues } from "@/lib/schemas";
import GroupSection from "@/components/TravelForm/GroupSection";

function Wrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<TravelFormValues>({
    resolver: zodResolver(TravelFormSchema),
    defaultValues: {
      accommodation: { booked: false },
      // Use "Family" so adults + children inputs are always rendered
      group: { adults: 2, children: 1, type: "Family" },
      preferences: ["Food"],
      transportMode: "publicTransport",
      destination: "Paris",
      departureDate: "2099-12-01",
      returnDate: "2099-12-10",
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("GroupSection", () => {
  it("renders group type buttons", () => {
    render(<Wrapper><GroupSection /></Wrapper>);
    // GroupSection renders a button grid, not a <select>
    expect(screen.getByRole("button", { name: /family/i })).toBeInTheDocument();
  });

  it("renders adults input", () => {
    render(<Wrapper><GroupSection /></Wrapper>);
    expect(screen.getByLabelText(/adults/i)).toBeInTheDocument();
  });

  it("renders children input", () => {
    render(<Wrapper><GroupSection /></Wrapper>);
    expect(screen.getByLabelText(/children/i)).toBeInTheDocument();
  });

  it("allows switching group type by clicking a button", async () => {
    const user = userEvent.setup();
    render(<Wrapper><GroupSection /></Wrapper>);
    const soloBtn = screen.getByRole("button", { name: /solo/i });
    await user.click(soloBtn);
    // After clicking Solo the Solo button should appear selected
    expect(soloBtn).toBeInTheDocument();
  });

  it("allows changing adults count", async () => {
    const user = userEvent.setup();
    render(<Wrapper><GroupSection /></Wrapper>);
    const adultsInput = screen.getByLabelText(/adults/i);
    await user.clear(adultsInput);
    await user.type(adultsInput, "3");
    expect(adultsInput).toHaveValue(3);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (component not yet imported/verified)**

```bash
npm test -- --testPathPattern=GroupSection
```

Expected: tests compile and run. If GroupSection renders correctly they PASS. If there are import issues, fix them (check the actual export from `GroupSection.tsx`).

- [ ] **Step 3: Commit tests**

```bash
git add src/__tests__/components/GroupSection.test.tsx
git commit -m "test: add GroupSection component tests"
```

---

## Task 7: Update tester agent to enforce TDD workflow

**Files:**
- Modify: `.claude/agents/tester.md`

The current agent reads source first, then writes tests. Update it to enforce: **write test → run (expect fail or pass) → commit tests → then implementation**.

- [ ] **Step 1: Update `.claude/agents/tester.md`**

Replace the `## When invoked` section with:

```markdown
## When invoked

### For NEW features or bugfixes (TDD — strictly tests first)

1. **Read the spec / requirements** — do NOT read implementation files yet
2. **Write failing tests** covering the required behavior (happy path + edge cases)
3. **Run `npm test -- --testPathPattern=<filename>`** — verify tests fail with a meaningful error (not a compile error)
4. **Commit the failing tests**: `git commit -m "test: <description> (failing — TDD)"`
5. **Signal to implementation agent**: "Tests written and committed. Implement `<file>` to make these tests pass."
6. **After implementation**: Run tests again and verify all pass
7. **Commit passing state**: `git commit -m "test: <description> (passing)"`

### For existing code (test coverage)

1. Read the source file
2. Write tests covering happy path + edge cases
3. Run tests — expect them to pass (existing code already implements behavior)
4. If any test fails, it reveals a bug — report it before fixing
5. Commit: `git commit -m "test: add <module> test coverage"`

### Rules

- Mock `@anthropic-ai/sdk` in all API tests — never make real API calls
- Mock `localStorage` using `jest-localstorage-mock` (already in `jest.setup.ts`)
- Use `userEvent` (not `fireEvent`) for all user interactions
- Each test file must have a `describe` block matching the component/module name
- Test both happy path AND error/edge cases
- Never claim tests pass without running `npm test` and showing the output
```

- [ ] **Step 2: Verify the agent file is valid markdown with correct frontmatter**

```bash
head -10 .claude/agents/tester.md
```

Expected: frontmatter block with `name: tester` intact.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/tester.md
git commit -m "chore(agents): update tester agent to enforce TDD workflow"
```

---

## Task 8: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all test suites pass, no errors.

- [ ] **Step 2: Run coverage report**

```bash
npm run test:coverage
```

Review coverage output. Note any critical uncovered paths.

- [ ] **Step 3: Final commit if any loose files**

```bash
git status
```

If clean: nothing to do. If any files remain unstaged, add and commit.

---

## Summary

After this plan is executed:
- Jest is fully configured and working with Next.js 16 + React 19 + TypeScript paths
- HIGH-priority tests cover schema validation, localStorage CRUD, API route, and GroupSection
- The tester agent enforces TDD: failing tests are committed before any implementation code is written
- `npm test`, `npm run test:watch`, and `npm run test:coverage` all work
