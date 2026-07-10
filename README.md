# student-bostader

pnpm monorepo with a TanStack Start web app and a TypeScript scraper.

## Structure

```
apps/
  web/       # TanStack Start app
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

# Run the scraper once
pnpm scraper

# Run the scraper in watch mode
pnpm --filter @student-bostader/scraper dev

# Build the web app
pnpm build
```
