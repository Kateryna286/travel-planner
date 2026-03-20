# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important**: This project uses Next.js 16, which has breaking changes from earlier versions. Before writing code, check `node_modules/next/dist/docs/` for current APIs and conventions.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Run ESLint
```

There is no test runner configured yet. Add one (e.g., Jest + React Testing Library) before writing tests.

## Environment variables

```
ANTHROPIC_API_KEY=   # Required — Anthropic API key (set in .env.local)
```

## Architecture

This is a **Next.js 16 app** using the **App Router** (`src/app/`), TypeScript, Tailwind CSS v4, React 19, and Zod v4.

Key runtime dependencies: `@anthropic-ai/sdk`, `react-hook-form`, `@hookform/resolvers`, `framer-motion`, `jspdf`.

### Key conventions

- **Routing**: File-based via `src/app/`. Each folder with a `page.tsx` becomes a route. Layouts in `layout.tsx` wrap child routes.
- **Components**: Shared components in `src/components/`. Component groups use an `index.tsx` entry with co-located sub-components (e.g. `src/components/TravelForm/`, `src/components/TravelReport/`, `src/components/MyGuides/`).
- **Server vs. Client**: App Router components are Server Components by default. Add `"use client"` only when you need browser APIs, event handlers, or React state/effects.
- **Styles**: Global styles in `src/app/globals.css`. Use Tailwind utility classes; avoid separate CSS modules unless scoping is necessary.
- **Path alias**: `@/*` maps to `src/*` (configured in `tsconfig.json`).
- **Validation**: `src/lib/schemas.ts` defines `TravelFormSchema` (Zod) — the single source of truth for form validation, shared by the UI and the API route.
- **AI calls**: `src/app/api/travel/route.ts` fires two parallel `claude-sonnet-4-6` calls (experiences + practicalities) and merges them into `TravelReport`.
- **Prompts**: `src/lib/prompts.ts` exports `buildExperiencesPrompt` and `buildPracticalitiesPrompt`. Bump `PROMPT_VERSION` whenever the prompt contract changes.
- **PDF**: `src/lib/pdf-generator.ts` uses `jsPDF` to produce an A4 travel guide client-side. `generateGuideId` creates a deterministic-ish ID used as the guide's filename suffix.
- **Storage**: `src/lib/guides-storage.ts` persists saved guides to `localStorage` under the key `"travelGuides"` as `SavedGuide[]`.
