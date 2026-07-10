import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { createServerFn } from '@tanstack/react-start'

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

async function loadLagenheter(): Promise<Lagenhet[]> {
  const filePath = join(process.cwd(), 'public/lagenheter.json')
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw) as Lagenhet[]
}

export const getLagenheter = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Lagenhet[]> => loadLagenheter(),
)

export const getLagenhet = createServerFn({ method: 'GET' })
  .inputValidator((objektNr: string) => objektNr)
  .handler(async ({ data: objektNr }): Promise<Lagenhet | null> => {
    const lagenheter = await loadLagenheter()
    return lagenheter.find((lagenhet) => lagenhet.objektNr === objektNr) ?? null
  })
