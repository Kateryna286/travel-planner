# Travel Planner

An AI-powered travel guide generator. Fill in your destination, dates, group details, and preferences — the app calls Claude to produce a personalised guide covering attractions, local cuisine, safety status, and practical information. Guides can be saved in your browser and downloaded as a formatted PDF.

## Features

- **Destination validation** — the AI rejects fictional or unrecognisable destinations before generating content
- **Safety assessment** — RED / ORANGE / GREEN traffic-light rating with headline and specific risk details
- **Personalised attractions** — 8–12 highlights filtered by travel preferences (Nature, Food, Art, Adventure, Architecture, Entertainment, Shopping, Wellness, LocalExperiences) and tailored to group type (Family, Solo, Couple, Business, Friends)
- **Transport-aware directions** — every attraction includes how to reach it by car or by public transport
- **Accommodation suggestions** — when no accommodation is booked, the AI recommends 2–3 neighbourhoods with best itinerary access
- **Cuisine guide** — must-try dishes, restaurant categories, dining customs, tipping norms, and dietary considerations
- **Practical info** — currency, electricity, visa, language phrases, weather and packing tips, emergency contacts, cultural customs
- **Destination facts** — 5 surprising facts included in every guide
- **PDF download** — styled A4 PDF with cover page, attraction cards, dining guide, and practical info sections
- **My Guides** — saved guides persisted to `localStorage`; viewable and re-downloadable without another API call

## Tech stack

- **Next.js 16** (App Router) + TypeScript + React 19
- **Tailwind CSS v4**
- **Anthropic SDK** (`claude-sonnet-4-6`) — two parallel calls per request
- **Zod v4** + **react-hook-form** for form validation
- **jsPDF** for client-side PDF generation
- **framer-motion** for UI animations

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

## Setup

```bash
git clone <repo-url>
cd travel-planner
npm install
```

Create `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

Each form submission fires two `claude-sonnet-4-6` calls in parallel:

```
POST /api/travel
  |
  ├─ Call A — Experiences (temp 0.7, max 12 000 tokens)
  |    Produces: safety, attractions, cuisine, accommodationSuggestions?
  |
  └─ Call B — Practicalities (temp 0.3, max 6 000 tokens)
       Produces: practical info, destinationFacts

Both calls validate the destination first.
If either returns { valid: false } → 422 INVALID_DESTINATION.
Otherwise results are merged into a single TravelReport.
```

## Project structure

```
src/
  app/
    page.tsx                  # Single-page app shell (client component)
    layout.tsx                # Root layout + metadata
    globals.css               # Global styles + Tailwind
    api/travel/route.ts       # POST /api/travel — parallel AI calls + merge
  components/
    TravelForm/               # Multi-section form (destination, dates, group, preferences)
    TravelReport/             # Report display (safety, attractions, cuisine, practical)
    MyGuides/                 # Saved guide gallery and viewer
  lib/
    prompts.ts                # Prompt builders for Call A and Call B (PROMPT_VERSION tracks contract)
    schemas.ts                # TravelFormSchema (Zod) — shared by UI and API route
    guides-storage.ts         # localStorage CRUD for SavedGuide[]
    pdf-generator.ts          # jsPDF A4 guide generation + generateGuideId()
    anthropic.ts              # Anthropic SDK client singleton
  types/
    travel.ts                 # All TypeScript interfaces and types
```

## API

### `POST /api/travel`

**Request body** — fields validated by `TravelFormSchema`:

| Field | Type | Notes |
|---|---|---|
| `destination` | `string` | 2–100 characters |
| `departureDate` | `string` | YYYY-MM-DD, today or later |
| `returnDate` | `string` | YYYY-MM-DD, after departureDate |
| `accommodation.booked` | `boolean` | |
| `accommodation.address` | `string?` | Required when booked is true (min 5 chars) |
| `group.adults` | `number` | 1–20 |
| `group.children` | `number` | 0–20 |
| `group.type` | `GroupType` | Family \| Friends \| Solo \| Couple \| Business |
| `preferences` | `TravelPreference[]` | At least one required |
| `transportMode` | `string` | `"car"` \| `"publicTransport"` |

**Success response** (`200`):

```json
{ "success": true, "report": { ...TravelReport } }
```

**Error responses**:

| Status | Code | Meaning |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request body fails schema |
| `422` | `INVALID_DESTINATION` | AI rejected the destination |
| `429` | `RATE_LIMIT` | Anthropic rate limit hit |
| `500` | `AI_ERROR` | Unexpected model error |

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Run ESLint
```
