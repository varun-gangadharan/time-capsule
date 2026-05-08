# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build (output in `dist/`)
- `npm run preview` — preview production build locally
- No linter or test runner is configured yet.

## Architecture

React + TypeScript + Vite app with Tailwind CSS v4 (using `@tailwindcss/vite` plugin, not PostCSS).

**Routing:** React Router v7 (`react-router`) with `createBrowserRouter` in `src/app/routes.tsx`. Pages live in `src/app/pages/`.

**Path alias:** `@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`).

**Styles:** Entry point is `src/styles/index.css` → imports `tailwind.css` (Tailwind v4 `@import 'tailwindcss'` with `source(none)` + explicit `@source`) and `theme.css` (CSS custom properties for design tokens, shadcn/ui-style theme variables).

**Key dependencies:**
- `motion` (Framer Motion) — animations throughout, imported as `motion/react`
- `lucide-react` — icons
- `class-variance-authority` + `clsx` + `tailwind-merge` — utility for conditional class merging via `cn()` in `src/app/components/ui/utils.ts`

**Data persistence:** localStorage (no backend). MVP data model uses a `Capsule` type with id, title, message, openDate, createdAt, mood, tags, prompt, status fields.

## Visual Design

The app uses a retro computer interface / scrapbook aesthetic. Key visual patterns:
- Lavender background (`#E8D5F2`) with SVG noise texture overlay
- Retro OS-style window containers with title bars (traffic light dots), chunky 3px black borders, hard drop shadows
- Tactile buttons with press-down shadow animations via Framer Motion `whileHover`/`whileTap`
- Inline gradient backgrounds (greens, pinks, yellows) — colors are hardcoded hex values, not theme tokens
- Uppercase bold labels with wide letter-spacing

When adding new pages or components, match this established visual language rather than using the shadcn/theme variables.
