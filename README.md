# Memory Capsule

A retro-styled digital time capsule app. Write messages to your future self, seal them with a date, and reveal them when the time comes.

## Tech Stack

- **React 18** + TypeScript
- **Vite** — dev server and build
- **Tailwind CSS v4** — styling via `@tailwindcss/vite` plugin
- **Framer Motion** (`motion`) — animations
- **React Router v7** — client-side routing
- **localStorage** — data persistence (no backend)

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## MVP Features

- **Create capsules** — write a title, message, and choose a future open date
- **Save as draft** — come back and edit before sealing
- **Seal capsules** — lock them until their open date arrives
- **Open & reveal** — animated reveal experience when the date arrives
- **Archive view** — see all your capsules (drafts, sealed, ready, opened)
- **Persistent storage** — capsules survive page refresh via localStorage
- **Vessel themes** — choose between capsule, envelope, or constellation visual styles
- **Retro design** — chunky borders, hard shadows, paper textures, and sticker labels

## Planned Next Features

- Email delivery / shareable links
- Backend persistence and user accounts
- Collaborative capsules (group messages)
- Photo and media attachments
- Custom open conditions (location, event triggers)
- Export / print opened capsules
