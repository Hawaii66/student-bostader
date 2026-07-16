# Studentbostäder

## About

A personal tool for browsing and comparing vacant student apartments from [Studentbostäder](https://www.studentbostader.se/) in Linköping.

It scrapes the official housing market site, stores the listings locally, and serves them in a web app with filtering, favorites, and detail views. Beyond a plain listing browser, it also helps you reason about competition:

- **Lediga lägenheter** — browse, filter, sort, and favorite available apartments
- **Konkurrens** — see which queue points (`köpoäng`) have registered interest on which apartments, and how bookable your saved choices look
- **Playoff** — simulate how apartments might be allocated based on queue points and interest registrations

The repo is a pnpm monorepo with two apps:

```
apps/
  web/       # TanStack Start app (Cloudflare Workers)
  scraper/   # TypeScript scraper for marknad.studentbostader.se
```

## How to use

### Setup

```bash
pnpm install
```

### Refresh apartment data

Fetch all listings (and interest data) and write them into the web app’s embedded data files:

```bash
pnpm scraper:save
```

This writes `apps/web/src/data/lagenheter.json` and `apps/web/src/data/intresse.json`, which Vite bundles into the app.

To print scraped listings as JSON without saving:

```bash
pnpm scraper
```

### Run the web app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build
```

`pnpm build` always runs `scraper:save` (via the web package) so `lagenheter.json` and `intresse.json` are generated before Vite bundles them.

### Deploy

```bash
pnpm deploy
```

Deploys to Cloudflare Workers at **https://student-bostader.hawaiidev.sh** (scrapes, builds, then `wrangler deploy`).

## Cloudflare

The web app uses `@cloudflare/vite-plugin` and deploys as a Worker.

```bash
# Preview the Worker build locally
pnpm --filter @student-bostader/web preview

# Deploy (from repo root; scrapes then builds)
pnpm deploy
```

`hawaiidev.sh` must be a zone on the same Cloudflare account. On deploy, Wrangler attaches the custom domain and Cloudflare manages DNS + TLS.

### Workers Builds

Use these dashboard settings (root must be the package that contains `wrangler.jsonc`):

| Setting | Value |
| --- | --- |
| **Root directory** | `/apps/web` |
| **Build command** | `pnpm build` |
| **Deploy command** | `npx wrangler deploy` |

`pnpm build` in `apps/web` runs the scraper first (`@student-bostader/scraper save`), then `vite build`. pnpm still installs the whole workspace, so the scraper package is available even with root set to `/apps/web`.

### Daily rebuild (10:00)

The Worker has a cron trigger (`0 8 * * *` UTC ≈ 10:00 Europe/Stockholm in summer) that POSTs a [Deploy Hook](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/) so Workers Builds re-scrapes and redeploys.

1. In the Worker: **Settings → Builds → Deploy Hooks** → create a hook for `main`, copy the URL.
2. Set the secret (once, from `apps/web`):

```bash
pnpm --filter @student-bostader/web exec wrangler secret put DEPLOY_HOOK_URL
```

Paste the Deploy Hook URL when prompted. After the next deploy, the morning cron will trigger a full rebuild (scrape + build + deploy).

To test without waiting for the cron:

```bash
curl -X POST "$DEPLOY_HOOK_URL"
```
