import { z } from "zod";

const bildSchema = z.object({
  url: z.string(),
  text: z.string().nullable(),
});

const egenskapSchema = z.object({
  id: z.string(),
  beskrivning: z.string(),
  beskrivningDetalj: z.string(),
  beskrivningKort: z.string(),
});

/** Raw apartment object from the widgets API (`objektlistabilder@lagenheter`). */
export const rawLagenhetSchema = z.object({
  objektNr: z.string(),
  tinyObjektNr: z.string(),
  adress: z.string(),
  omrade: z.string().nullable(),
  omradeKod: z.string().nullable(),
  hyra: z.string(),
  hyraEnhet: z.string(),
  typ: z.string(),
  typOvergripande: z.string(),
  yta: z.number(),
  vaning: z.string(),
  antalVaningar: z.string().nullable(),
  inflyttningDatum: z.string(),
  inflyttningTidigareDatum: z.string().nullable(),
  detaljUrl: z.string(),
  hiss: z.string(),
  fritext: z.string().nullable(),
  poang: z.string(),
  egenskaper: z.array(egenskapSchema),
  bild: bildSchema,
  bilder: z.array(bildSchema),
  publiceratDatum: z.string(),
  harIntresseanmaltsAvInloggadKund: z.boolean(),
});

export type RawLagenhet = z.infer<typeof rawLagenhetSchema>;

/** Normalized apartment used by the rest of the app. */
export const lagenhetSchema = z.object({
  objektNr: z.string(),
  tinyObjektNr: z.string(),
  adress: z.string(),
  omrade: z.string(),
  omradeKod: z.string(),
  hyra: z.number(),
  hyraEnhet: z.string(),
  typ: z.string(),
  typOvergripande: z.string(),
  yta: z.number(),
  vaning: z.string(),
  antalVaningar: z.number().nullable(),
  inflyttningDatum: z.string(),
  inflyttningTidigareDatum: z.string().nullable(),
  detaljUrl: z.string(),
  refid: z.string(),
  hiss: z.boolean(),
  beskrivning: z.string(),
  poang: z.number(),
  egenskaper: z.array(egenskapSchema),
  bildUrl: z.string(),
  bilder: z.array(bildSchema),
  publiceratDatum: z.string(),
  harIntresseanmaltsAvInloggadKund: z.boolean(),
  planlosningUrl: z.string().nullable(),
});

export type Lagenhet = z.infer<typeof lagenhetSchema>;

function parseSwedishNumber(value: string): number {
  return Number(value.replace(/\s/g, "").replace(",", "."));
}

function parsePoang(value: string): number {
  return parseSwedishNumber(value.replace(/p$/i, ""));
}

const STUDENTBOSTADER_DETALJ_BASE =
  "https://www.studentbostader.se/soker-bostad/lediga-bostader/bostad/";

function parseRefid(detaljUrl: string): string {
  const match = detaljUrl.match(/refid=([^&]+)/);
  if (!match) {
    throw new Error(`Could not extract refid from detaljUrl: ${detaljUrl}`);
  }
  return match[1];
}

export function buildDetaljUrl(refid: string): string {
  const url = new URL(STUDENTBOSTADER_DETALJ_BASE);
  url.searchParams.set("refid", refid);
  return url.toString();
}

/** Image URLs from the API 404 without width/height query params. */
export function withBildDimensions(
  url: string,
  width = 750,
  height = 435,
): string {
  const parsed = new URL(url);
  if (!parsed.searchParams.has("width")) {
    parsed.searchParams.set("width", String(width));
  }
  if (!parsed.searchParams.has("height")) {
    parsed.searchParams.set("height", String(height));
  }
  return parsed.toString();
}

export function normalizeLagenhet(raw: RawLagenhet): Lagenhet {
  const refid = parseRefid(raw.detaljUrl);

  return lagenhetSchema.parse({
    objektNr: raw.objektNr,
    tinyObjektNr: raw.tinyObjektNr,
    adress: raw.adress,
    omrade: raw.omrade ?? "",
    omradeKod: raw.omradeKod ?? "",
    hyra: parseSwedishNumber(raw.hyra),
    hyraEnhet: raw.hyraEnhet,
    typ: raw.typ,
    typOvergripande: raw.typOvergripande,
    yta: raw.yta,
    vaning: raw.vaning,
    antalVaningar: raw.antalVaningar ? Number(raw.antalVaningar) : null,
    inflyttningDatum: raw.inflyttningDatum,
    inflyttningTidigareDatum: raw.inflyttningTidigareDatum,
    detaljUrl: buildDetaljUrl(refid),
    refid,
    hiss: raw.hiss.toLowerCase() === "ja",
    beskrivning: (raw.fritext ?? "").trim(),
    poang: parsePoang(raw.poang),
    egenskaper: raw.egenskaper,
    bildUrl: withBildDimensions(raw.bild.url),
    bilder: raw.bilder.map((bild) => ({
      ...bild,
      url: withBildDimensions(bild.url),
    })),
    publiceratDatum: raw.publiceratDatum,
    harIntresseanmaltsAvInloggadKund: raw.harIntresseanmaltsAvInloggadKund,
    planlosningUrl: null,
  });
}
