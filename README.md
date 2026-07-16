# student-bostader

pnpm monorepo with a TanStack Start web app and a TypeScript scraper.

## Structure

```
apps/
  web/       # TanStack Start app (Cloudflare Workers)
  scraper/   # TypeScript scraper
```

## Setup

```bash
pnpm install
```

## Commands

```bash
# Start the web app (http://localhost:3000)
pnpm dev

# Scrape and write lagenheter.json + intresse.json into apps/web/public
pnpm scraper:save

# Run the scraper once (stdout only, first page)
pnpm scraper

# Build (scrapes lagenheter + intresse, then builds the web app)
pnpm build

# Deploy to Cloudflare Workers (scrapes, builds, then wrangler deploy)
pnpm deploy
```

## Cloudflare

The web app uses `@cloudflare/vite-plugin` and deploys as a Worker at **https://student-bostader.hawaiidev.sh**.

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

`pnpm build` always runs `scraper:save` so `lagenheter.json` and `intresse.json` are generated before Vite bundles static assets.
