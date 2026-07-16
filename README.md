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

Fetch all listings (and interest data) and write them into the web app’s public JSON files:

```bash
pnpm scraper:save
```

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

`pnpm build` always runs `scraper:save` so `lagenheter.json` and `intresse.json` are generated before Vite bundles static assets.

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

# Deploy (from repo root; runs scraper:save first)
pnpm deploy
```

`hawaiidev.sh` must be a zone on the same Cloudflare account. On deploy, Wrangler attaches the custom domain and Cloudflare manages DNS + TLS.

For [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), use the repo root as the build root:

- **Build command:** `pnpm build`
- **Deploy command:** `pnpm --filter @student-bostader/web exec wrangler deploy`
- **Root directory:** `/` (monorepo root)
