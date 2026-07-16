import lagenheterData from '#/data/lagenheter.json'
import type { Lagenhet } from '#/types/lagenhet'

const STUDENTBOSTADER_DETALJ_BASE =
  'https://www.studentbostader.se/soker-bostad/lediga-bostader/bostad/'

const lagenheter = lagenheterData as Lagenhet[]

export function buildStudentbostaderDetaljUrl(refid: string): string {
  const url = new URL(STUDENTBOSTADER_DETALJ_BASE)
  url.searchParams.set('refid', refid)
  return url.toString()
}

function buildMapsQuery(adress: string): string {
  return encodeURIComponent(`${adress}, Linköping`)
}

export function buildGoogleMapsUrl(adress: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${buildMapsQuery(adress)}`
}

export function buildAppleMapsUrl(adress: string): string {
  return `https://maps.apple.com/?q=${buildMapsQuery(adress)}`
}

export function buildGoogleEarthUrl(adress: string): string {
  return `https://earth.google.com/web/search/${buildMapsQuery(adress)}`
}

export async function getLagenheter(): Promise<Lagenhet[]> {
  return lagenheter
}

export async function getLagenhet(objektNr: string): Promise<Lagenhet | null> {
  return lagenheter.find((lagenhet) => lagenhet.objektNr === objektNr) ?? null
}
