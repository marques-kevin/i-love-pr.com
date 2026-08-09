# iLovePR

Self-hosted, single-user GitHub pull request analytics. A lightweight Swarmia/LinearB-style dashboard that runs entirely in the browser — no backend, no accounts, no webhooks.

## Features

- Paste a GitHub Personal Access Token (stored only in IndexedDB)
- Track one or more `owner/repo` repositories
- Incremental sync with resumeable backfill and rate-limit awareness
- Metrics: cycle time, time to first review, review rounds, PR size, throughput, reviewer load
- Filters by period (7d / 30d / 90d / custom), repo, and team member
- Installable PWA (static hosting on GitHub Pages, Netlify, or Vercel)

## Stack

- React + Vite + TypeScript
- shadcn/ui (Radix Nova) + Tailwind CSS
- Dexie.js (IndexedDB)
- GitHub GraphQL API v4
- Recharts via shadcn Chart
- vite-plugin-pwa

Add UI primitives with:

```bash
npx shadcn@latest add <component>
```

## Quick start

Requires [Node.js 24+](https://nodejs.org/) (see `.nvmrc`). With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install
nvm use
npm install
npm run dev
```

Open the app, paste a PAT with `repo` (or `public_repo`) read scope, add repositories, and start analyzing.

## Build & deploy

```bash
npm run build
```

Deploy the `dist/` folder to any static host.

### Cloudflare Pages

Pages still exists (separate from Workers). Prefer it for this static app.

**Dashboard**

1. [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages) → **Create application** → **Pages** → **Connect to Git**
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Environment variable: `NODE_VERSION=24`

**CLI** (Direct Upload)

```bash
npx wrangler login
npx wrangler pages project create ilovepr   # once
npm run deploy                             # build + pages deploy
```

Note: `wrangler deploy` (without `pages`) creates a **Workers** assets project — that’s why you saw a Worker with no logs (no Worker script runs). Use `wrangler pages deploy` for a real Pages project (`*.pages.dev`).

If you already created a Worker named `ilovepr`, delete it in the dashboard (or rename the Pages project) to avoid confusion.

## Privacy

- The PAT never leaves the browser except for direct calls to `api.github.com`
- All PR metadata lives in IndexedDB
- Use **Settings → Reset local data** if the sync cursor is corrupted, or **Factory reset** to wipe everything

## Sync model

On launch (or force refresh):

1. No local data → full backfill (paginated GraphQL)
2. Data older than the configured interval (default 24h) → incremental refresh from the `updatedAt` cursor
3. Fresh cache → serve local data only

Cursors are persisted after each page so a rate-limit pause can resume later.
