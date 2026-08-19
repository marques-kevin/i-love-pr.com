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

Git-connected auto deploy (push to `main`).

Build settings in the Cloudflare dashboard:

- **Build command:** `npm run build`
- **Build output directory:** `dist` (also set in `wrangler.jsonc`)
- **Node version:** `24` (`NODE_VERSION=24` or `.nvmrc`)

#### Repository sharing (R2)

Sharing synced PR snapshots is gated on Cloudflare. Tech Lead provisions the bucket and secrets — do not create buckets or put real secrets in git.

Required Cloudflare Pages / Worker settings:

- **R2 bucket** `ilovepr-shares`, bound as `SHARE_BUCKET` (see `wrangler.jsonc`)
- **Secret** `SHARE_UPLOAD_SECRET` — runtime secret checked by both upload paths (`POST /api/share/upload-url` and `PUT /api/share/upload/:id`). If this var is missing or blank, uploads **fail closed** (403).
- **Build var** `VITE_SHARE_UPLOAD_SECRET` — same value as `SHARE_UPLOAD_SECRET`, so the SPA can send header `x-share-upload-secret`. Optional: `Authorization: Bearer <secret>` is also accepted.

Uploads are capped at **50 MiB**. Declared `content_length` is required to mint an upload URL, but that is not the enforcement: every PUT is proxied through `PUT /api/share/upload/:id`, which checks `SHARE_UPLOAD_SECRET` and the **actual body size**. Direct R2 presigned PUTs are not used (they would bypass the worker cap). Downloads may still use a presigned GET when R2 API credentials are set.

Optional R2 API credentials for true presigned URLs: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`. Without them, upload/download is proxied through Pages Functions.

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
