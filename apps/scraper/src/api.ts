import { z } from "zod";

import { normalizeLagenhet, rawLagenhetSchema, type Lagenhet } from "./schema/lagenhet.js";

const BASE_URL = "https://marknad.studentbostader.se/widgets/";

const WIDGETS = [
  "objektfilter@lagenheter",
  "objektsortering",
  "paginering@lagenheter",
  "objektlistabilder@lagenheter",
  "pagineringgonew@lagenheter",
  "pagineringlista@lagenheter",
  "pagineringgoold@lagenheter",
] as const;

const paginationSchema = z.object({
  forst: z.string(),
  sist: z.string(),
  alla: z.string(),
});

const widgetsResponseSchema = z.object({
  data: z.object({
    "objektlistabilder@lagenheter": z.array(rawLagenhetSchema),
    "paginering@lagenheter": paginationSchema,
  }),
});

export type Pagination = z.infer<typeof paginationSchema>;

export type FetchLagenheterOptions = {
  page?: number;
  pageSize?: number;
};

export type FetchLagenheterResult = {
  lagenheter: Lagenhet[];
  pagination: Pagination;
};

function buildWidgetsUrl({ page = 0, pageSize = 10 }: FetchLagenheterOptions): string {
  const params = new URLSearchParams({
    pagination: String(page),
    paginationantal: String(pageSize),
    callback: `jQuery${Date.now()}_${Date.now()}`,
    _: String(Date.now() + 1),
  });

  for (const widget of WIDGETS) {
    params.append("widgets[]", widget);
  }

  return `${BASE_URL}?${params.toString()}`;
}

function parseJsonp(body: string): unknown {
  const start = body.indexOf("(");
  const end = body.lastIndexOf(")");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Response is not valid JSONP");
  }

  return JSON.parse(body.slice(start + 1, end));
}

export async function fetchLagenheter(
  options: FetchLagenheterOptions = {},
): Promise<FetchLagenheterResult> {
  const url = buildWidgetsUrl(options);

  const response = await fetch(url, {
    headers: {
      Accept: "text/javascript, application/javascript, */*; q=0.01",
      "Accept-Language": "en-US,en;q=0.9",
      Origin: "https://www.studentbostader.se",
      Referer: "https://www.studentbostader.se/",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch apartments: ${response.status} ${response.statusText}`);
  }

  const body = await response.text();
  const parsed = widgetsResponseSchema.parse(parseJsonp(body));

  return {
    lagenheter: parsed.data["objektlistabilder@lagenheter"].map(normalizeLagenhet),
    pagination: parsed.data["paginering@lagenheter"],
  };
}
