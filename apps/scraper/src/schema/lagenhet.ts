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
  omrade: z.string(),
  omradeKod: z.string(),
  hyra: z.string(),
  hyraEnhet: z.string(),
  typ: z.string(),
  typOvergripande: z.string(),
  yta: z.number(),
  vaning: z.string(),
  antalVaningar: z.string(),
  inflyttningDatum: z.string(),
  inflyttningTidigareDatum: z.string().nullable(),
  detaljUrl: z.string(),
  hiss: z.string(),
  fritext: z.string(),
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
  antalVaningar: z.number(),
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
});

export type Lagenhet = z.infer<typeof lagenhetSchema>;

function parseSwedishNumber(value: string): number {
  return Number(value.replace(/\s/g, "").replace(",", "."));
}

function parsePoang(value: string): number {
  return parseSwedishNumber(value.replace(/p$/i, ""));
}

function parseRefid(detaljUrl: string): string {
  const match = detaljUrl.match(/refid=([^&]+)/);
  if (!match) {
    throw new Error(`Could not extract refid from detaljUrl: ${detaljUrl}`);
  }
  return match[1];
}

export function normalizeLagenhet(raw: RawLagenhet): Lagenhet {
  return lagenhetSchema.parse({
    objektNr: raw.objektNr,
    tinyObjektNr: raw.tinyObjektNr,
    adress: raw.adress,
    omrade: raw.omrade,
    omradeKod: raw.omradeKod,
    hyra: parseSwedishNumber(raw.hyra),
    hyraEnhet: raw.hyraEnhet,
    typ: raw.typ,
    typOvergripande: raw.typOvergripande,
    yta: raw.yta,
    vaning: raw.vaning,
    antalVaningar: Number(raw.antalVaningar),
    inflyttningDatum: raw.inflyttningDatum,
    inflyttningTidigareDatum: raw.inflyttningTidigareDatum,
    detaljUrl: raw.detaljUrl,
    refid: parseRefid(raw.detaljUrl),
    hiss: raw.hiss.toLowerCase() === "ja",
    beskrivning: raw.fritext.trim(),
    poang: parsePoang(raw.poang),
    egenskaper: raw.egenskaper,
    bildUrl: raw.bild.url,
    bilder: raw.bilder,
    publiceratDatum: raw.publiceratDatum,
    harIntresseanmaltsAvInloggadKund: raw.harIntresseanmaltsAvInloggadKund,
  });
}
