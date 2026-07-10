import { fetchLagenheter, fetchPlanlosningUrl, type FetchLagenheterOptions } from "./api.js";
import type { Lagenhet } from "./schema/lagenhet.js";

export type ScrapeOptions = FetchLagenheterOptions & {
  /** Fetch every page until all apartments are collected. */
  allPages?: boolean;
};

export async function scrapeLagenheter(options: ScrapeOptions = {}): Promise<Lagenhet[]> {
  const { allPages = false, pageSize = 10, page = 0 } = options;

  const firstPage = await fetchLagenheter({ page, pageSize });
  const lagenheter = [...firstPage.lagenheter];

  if (!allPages) {
    return lagenheter;
  }

  const total = Number(firstPage.pagination.alla);
  const totalPages = Math.ceil(total / pageSize);

  for (let currentPage = page + 1; currentPage < totalPages; currentPage += 1) {
    const result = await fetchLagenheter({ page: currentPage, pageSize });
    lagenheter.push(...result.lagenheter);
  }

  return enrichWithPlanlosning(lagenheter);
}

async function enrichWithPlanlosning(lagenheter: Lagenhet[]): Promise<Lagenhet[]> {
  const enriched: Lagenhet[] = [];

  for (const lagenhet of lagenheter) {
    const planlosningUrl = await fetchPlanlosningUrl(lagenhet.refid);
    enriched.push({ ...lagenhet, planlosningUrl });
  }

  return enriched;
}
