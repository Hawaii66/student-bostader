import { createIsomorphicFn } from '@tanstack/react-start'

import type { Lagenhet } from '#/types/lagenhet'

const STUDENTBOSTADER_DETALJ_BASE =
  'https://www.studentbostader.se/soker-bostad/lediga-bostader/bostad/'

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

const loadLagenheter = createIsomorphicFn()
  .client(async (): Promise<Lagenhet[]> => {
    const response = await fetch(`${import.meta.env.BASE_URL}lagenheter.json`)
    if (!response.ok) {
      throw new Error(`Failed to load lägenheter: ${response.status}`)
    }
    return response.json() as Promise<Lagenhet[]>
  })
  .server(async (): Promise<Lagenhet[]> => {
    const { readFile } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const raw = await readFile(join(process.cwd(), 'public/lagenheter.json'), 'utf-8')
    return JSON.parse(raw) as Lagenhet[]
  })

export async function getLagenheter(): Promise<Lagenhet[]> {
  return loadLagenheter()
}

export async function getLagenhet(objektNr: string): Promise<Lagenhet | null> {
  const lagenheter = await loadLagenheter()
  return lagenheter.find((lagenhet) => lagenhet.objektNr === objektNr) ?? null
}
