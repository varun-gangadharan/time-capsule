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

**Styles:** Entry point is `src/styles/index.css` → imports `tailwind.css` (Tailwind v4 setup) and `theme.css` (retro design tokens as CSS custom properties, registered in `@theme inline` for Tailwind access). `index.css` also defines the `retro-input` utility class via `@utility`.

**Key dependencies:**
- `motion` (Framer Motion) — animations throughout, imported as `motion/react`
- `lucide-react` — icons
- `class-variance-authority` + `clsx` + `tailwind-merge` — utility for conditional class merging via `cn()` in `src/app/components/ui/utils.ts`

**Data persistence:** Supabase (Postgres + Auth + RLS). Data layer in `src/lib/capsules.ts` — all CRUD functions are async. Auth via `src/lib/auth.tsx` (AuthProvider + useAuth hook). MVP data model uses a `Capsule` type with id, title, message, openDate, createdAt, updatedAt, mood, tags, prompt, status, vessel fields. Sealed capsule messages are redacted via a `capsules_safe` Postgres view until the open date. Opening a capsule uses a server-side `open_capsule()` RPC function for date enforcement.

**Auth:** Magic link (email OTP) + Google OAuth. Protected routes via `AuthLayout` wrapper in `src/app/layouts/AuthLayout.tsx`. Login page at `/login`.

**Database:** Schema in `supabase/migrations/001_initial_schema.sql`. Tables: `profiles` (extends auth.users), `capsules` (main data). RLS enforces user isolation. The `capsules_safe` view redacts sealed message content.

**Environment:** Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` (see `.env.example`).

## Design System

Reusable retro components live in `src/app/components/retro/`:
- **RetroPageBackground** — full-page wrapper with lavender bg, SVG noise texture, animated sparkle particles
- **RetroWindow** — OS-style window chrome with title bar, traffic-light dots, hard drop shadow. Takes `title` and `maxWidth` props.
- **RetroButton** — three variants: `primary` (green gradient, shadow press-down), `secondary` (white, scale), `ghost` (dimmed border, scale)
- **StickerLabel** — small pill/tag with icon + uppercase label + tinted background
- **SectionHeader** — page title with retro text shadow, optional subtitle. `size="lg"` or `"md"`.
- **PaperPanel** — gradient container panel (used for preview areas)

Design tokens (`--retro-*`) are defined in `src/styles/theme.css` and exposed as Tailwind colors via `@theme inline`. Use `bg-retro-page`, `from-retro-mint-from`, `to-retro-green-to`, etc. in Tailwind classes.

Compose-specific components (VesselCard, VesselPreview) live in `src/app/components/compose/`.

## Visual Direction

The app uses a retro computer interface / scrapbook aesthetic. When adding pages:
- Use `RetroPageBackground` + `RetroWindow` as the page shell
- Use `RetroButton` for actions, `StickerLabel` for tags/badges
- Use the `retro-input` CSS utility class for form inputs/textareas
- Reference `--retro-*` tokens for colors and shadows rather than hardcoding hex values
- Match the existing chunky borders, hard shadows, uppercase bold labels, and tactile animation style
