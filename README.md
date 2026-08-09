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

### Cloudflare (static hosting)

Cloudflare’s dashboard now creates **Workers** by default — classic **Pages**
projects are harder to find. For this app that’s fine: we deploy an
**assets-only Worker** (no server code), which behaves like Pages.

Config: `wrangler.jsonc` → serves `./dist` as a SPA.

```bash
npm install
npx wrangler login   # once
npm run deploy       # build + wrangler deploy
```

In the dashboard (Connect to Git), use the same idea:

- **Build command:** `npm run build`
- **Deploy / output:** `dist` (or Wrangler config `assets.directory`)
- **Node version:** `24`

No Worker script (`main`) is required — only static assets.

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
