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

## Architecture

This is a **Next.js 16 app** using the **App Router** (`src/app/`), TypeScript, and Tailwind CSS v4.

### Key conventions

- **Routing**: File-based via `src/app/`. Each folder with a `page.tsx` becomes a route. Layouts in `layout.tsx` wrap child routes.
- **Components**: Place shared components in `src/components/`. Co-locate route-specific components with their `page.tsx`.
- **Server vs. Client**: App Router components are Server Components by default. Add `"use client"` only when you need browser APIs, event handlers, or React state/effects.
- **Styles**: Global styles in `src/app/globals.css`. Use Tailwind utility classes; avoid separate CSS modules unless scoping is necessary.
- **Path alias**: `@/*` maps to `src/*` (configured in `tsconfig.json`).
