# Memory Capsule

A retro-styled digital time capsule app. Write messages to your future self (or someone else), seal them with a date, and reveal them when the time comes.

**Live at [varcapsule.xyz](https://varcapsule.xyz)**

![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

## What It Does

1. **Write** a message to your future self — or to someone else.
2. **Seal** it with a future unlock date. The message is hidden until that date arrives.
3. **Wait.** The capsule sits locked in your archive, contents redacted server-side.
4. **Open** it when the time comes. An animated reveal shows your past words.

Capsules can be kept private or shared with one recipient via email. Shared capsules require email verification before the recipient can view or open them.

## Features

- **Create & seal capsules** — title, message, unlock date, and vessel style
- **Save drafts** — come back and finish writing later
- **Email sharing** — send a sealed capsule to someone; they verify via OTP to view it
- **Server-enforced locking** — messages are redacted via a Postgres view until the open date; opening uses an RPC with date checks so clients can't bypass the lock
- **Animated reveal** — staggered entrance animations when a capsule is opened
- **Vessel themes** — choose between capsule, envelope, or constellation visual styles
- **Archive** — filter by drafts, sealed, opened, or received; search by title/tag/mood; sort by date
- **Notification emails** — daily cron job emails users when a capsule is ready to open
- **Data export/import** — download your capsules as JSON; re-import later
- **Multiple auth methods** — email/password, magic link (OTP), and Google OAuth
- **Retro design system** — chunky borders, hard drop shadows, paper noise textures, traffic-light window chrome, and sticker labels

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin), CSS custom properties |
| Animation | Framer Motion (`motion/react`) |
| Routing | React Router v7 |
| Backend | Supabase (Postgres, Auth, RLS, Edge Functions) |
| Email | Resend API (via Supabase Edge Functions) |
| Hosting | Vercel |
| Domain | Namecheap DNS |

## Architecture

```
src/
  app/
    pages/          — route-level page components
    components/
      retro/        — design system (RetroWindow, RetroButton, StickerLabel, etc.)
      compose/      — vessel cards and previews
      archive/      — capsule card component
    layouts/        — AuthLayout (protected route wrapper)
  lib/
    capsules.ts     — all CRUD, sharing, open/close, export/import
    auth.tsx        — AuthProvider + useAuth hook (magic link, password, Google)
    supabase.ts     — Supabase client init
    app-url.ts      — canonical app URL resolution
  styles/
    index.css       — entry point, imports tailwind + theme, defines utilities
    tailwind.css    — Tailwind v4 source config
    theme.css       — retro design tokens (--retro-*) registered in @theme inline

supabase/
  migrations/       — 7 SQL migrations (schema, RLS, sharing, notifications, timezone)
  functions/
    send-notifications/  — cron-triggered email for ready capsules
    send-share-invite/   — sends share invite emails to recipients
```

**Key design decisions:**

- **Message redaction is server-side.** A `capsules_safe` Postgres view returns empty message content for sealed capsules. Clients never receive the plaintext of a locked capsule.
- **Opening is server-enforced.** The `open_capsule()` and `open_shared_capsule()` RPC functions check status, ownership, email match, and date (Eastern Time) before updating. Clients can't fake an open.
- **Row-Level Security isolates users.** Each user can only read/write their own capsules. Shared capsules are readable by the recipient email via a separate RLS policy.
- **Design tokens in CSS custom properties** (`--retro-*`) are registered in Tailwind's `@theme inline` block, so all retro colors, shadows, and radii are usable as Tailwind classes.

## Running Locally

```bash
npm install
cp .env.example .env    # fill in your Supabase credentials
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_PUBLIC_APP_URL` | Canonical app URL for auth redirects (optional; defaults to `window.location.origin`) |

### Production Build

```bash
npm run build
npm run preview
```

## Deployment

Hosted on **Vercel** at [varcapsule.xyz](https://varcapsule.xyz).

DNS (Namecheap):
- `A` record: `@` → `76.76.21.21`
- `CNAME` record: `www` → `cname.vercel-dns.com`

Supabase Auth redirect URLs:
- Site URL: `https://varcapsule.xyz`
- Allowed redirects: `https://varcapsule.xyz/**`

Supabase Edge Function secrets:
- `APP_URL=https://varcapsule.xyz`
- `RESEND_API_KEY` — for email delivery
- `EMAIL_FROM` — sender address
- `CRON_SECRET` — shared secret for the notification cron job

## Design System

Reusable retro components in `src/app/components/retro/`:

| Component | Purpose |
|-----------|---------|
| `RetroPageBackground` | Full-page wrapper with lavender bg, SVG noise, floating sparkle particles |
| `RetroWindow` | OS-style window chrome with title bar and traffic-light dots |
| `RetroButton` | Three variants: primary (green, press-down shadow), secondary, ghost |
| `StickerLabel` | Small pill badge with icon + uppercase label |
| `SectionHeader` | Title with retro double text-shadow, optional subtitle |
| `PaperPanel` | Gradient container for preview areas |
| `FormField` | Label + input wrapper with hint text and error state |

Design tokens (`--retro-*`) are defined in `src/styles/theme.css` and include colors, gradients, shadows, radii, and a noise texture SVG.

## Database Schema

See `supabase/migrations/` for the full schema. Key tables:

- **`capsules`** — id, user_id, title, message, open_date, status (draft/sealed/opened), vessel, is_private, share_token, shared_with_email
- **`profiles`** — extends auth.users with display_name, theme preference, email_notifications toggle
- **`notification_queue`** — tracks pending/sent/failed email notifications with retry logic
- **`capsules_safe`** (view) — redacts message content for sealed capsules; computes `is_ready` flag

## License

MIT
