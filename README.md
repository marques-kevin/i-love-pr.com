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

### Cloudflare Pages (recommended for this app)

iLovePR is a **static** Vite PWA — no server code. Prefer **Workers & Pages → Create → Pages** (not a Worker).

If Cloudflare auto-created a **Worker** when you connected the repo:

1. Workers & Pages → delete / disconnect that Worker project
2. Create application → **Pages** → Connect to Git → this repository
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** `24` (matches `.nvmrc`)
4. Save and deploy

No `wrangler.toml` or Worker script is required.

For GitHub Pages, set `base` in `vite.config.ts` if the app is served from a subpath.

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
