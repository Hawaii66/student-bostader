import { fetchLagenheter, fetchPlanlosningUrl, type FetchLagenheterOptions } from "./api.js";
import { fetchIntresseIndex, type IntresseStatus } from "./intresse.js";
import type { Lagenhet } from "./schema/lagenhet.js";

export type ScrapeOptions = FetchLagenheterOptions & {
  /** Fetch every page until all apartments are collected. */
  allPages?: boolean;
  /** Fetch intresse status for all lägenheter. */
  withIntresse?: boolean;
};

export type ScrapeResult = {
  lagenheter: Lagenhet[];
  intresseIndex: Record<string, IntresseStatus>;
};

export async function scrapeLagenheter(options: ScrapeOptions = {}): Promise<Lagenhet[]> {
  const result = await scrapeAll(options);
  return result.lagenheter;
}

export async function scrapeAll(options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const { allPages = false, pageSize = 10, page = 0, withIntresse = false } = options;

  const firstPage = await fetchLagenheter({ page, pageSize });
  const lagenheter = [...firstPage.lagenheter];

  if (!allPages) {
    return { lagenheter, intresseIndex: {} };
  }

  const total = Number(firstPage.pagination.alla);
  const totalPages = Math.ceil(total / pageSize);

  for (let currentPage = page + 1; currentPage < totalPages; currentPage += 1) {
    const result = await fetchLagenheter({ page: currentPage, pageSize });
    lagenheter.push(...result.lagenheter);
  }

  const enriched = await enrichWithPlanlosning(lagenheter);
  const intresseIndex = withIntresse
    ? await fetchIntresseIndex(enriched.map((lagenhet) => lagenhet.refid))
    : {};

  return { lagenheter: enriched, intresseIndex };
}

async function enrichWithPlanlosning(lagenheter: Lagenhet[]): Promise<Lagenhet[]> {
  const enriched: Lagenhet[] = [];

  for (const lagenhet of lagenheter) {
    const planlosningUrl = await fetchPlanlosningUrl(lagenhet.refid);
    enriched.push({ ...lagenhet, planlosningUrl });
  }

  return enriched;
}
