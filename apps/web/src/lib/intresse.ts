import { createIsomorphicFn, createServerFn } from '@tanstack/react-start'

import type { IntresseIndexFile, IntresseStatus } from '#/types/intresse'

const WIDGETS_BASE_URL = 'https://marknad.studentbostader.se/widgets/'
const EMPTY_INTRESSE_INDEX: IntresseIndexFile = {
  fetchedAt: '1970-01-01T00:00:00.000Z',
  data: {},
}

function parseJsonp(body: string): unknown {
  const start = body.indexOf('(')
  const end = body.lastIndexOf(')')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Response is not valid JSONP')
  }
  return JSON.parse(body.slice(start + 1, end))
}

function parseSwedishNumber(value: string): number {
  return Number(value.replace(/\s/g, '').replace(',', '.'))
}

export function parseIntresseStatusHtml(html: string): IntresseStatus {
  const antalMatch = html.match(/intresseanm\u00e4lts av (\d+) personer/i)
  const antalIntresseanmalningar = antalMatch ? Number(antalMatch[1]) : null

  const topPoang: number[] = []
  for (const match of html.matchAll(/\d+\.\s*([\d\s]+)/g)) {
    topPoang.push(parseSwedishNumber(match[1]))
  }

  return {
    antalIntresseanmalningar,
    topPoang: topPoang.slice(0, 5),
  }
}

function detailReferer(refid: string): string {
  return `https://www.studentbostader.se/soker-bostad/lediga-bostader/bostad/?refid=${refid}`
}

async function fetchCsrfToken(refid: string): Promise<string> {
  const params = new URLSearchParams({
    refid,
    callback: `jQuery${Date.now()}`,
  })
  params.append('widgets', 'objektintressestatus')

  const response = await fetch(`${WIDGETS_BASE_URL}?${params}`, {
    headers: {
      Accept: 'text/javascript, application/javascript, */*; q=0.01',
      Origin: 'https://www.studentbostader.se',
      Referer: detailReferer(refid),
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch CSRF token: ${response.status}`)
  }

  const parsed = parseJsonp(await response.text()) as { CSRFtoken?: string }
  if (!parsed.CSRFtoken) {
    throw new Error('Missing CSRF token in widget response')
  }

  return parsed.CSRFtoken
}

async function fetchIntresseStatusHtml(refid: string): Promise<string | null> {
  const csrf = await fetchCsrfToken(refid)
  const body = new URLSearchParams()
  body.append('widgets[]', 'objektintressestatus')

  const response = await fetch(
    `${WIDGETS_BASE_URL}?refid=${encodeURIComponent(refid)}&callback=jQuery${Date.now() + 1}`,
    {
      method: 'POST',
      headers: {
        Accept: 'text/javascript, application/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded',
        CSRF: csrf,
        Origin: 'https://www.studentbostader.se',
        Referer: detailReferer(refid),
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: body.toString(),
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch intresse status: ${response.status}`)
  }

  const parsed = parseJsonp(await response.text()) as {
    html?: { 'objektintressestatus'?: string }
  }

  return parsed.html?.['objektintressestatus'] ?? null
}

async function fetchIntresseStatusForRefid(refid: string): Promise<IntresseStatus | null> {
  const html = await fetchIntresseStatusHtml(refid)
  if (!html) return null

  const status = parseIntresseStatusHtml(html)
  if (status.topPoang.length === 0 && status.antalIntresseanmalningar === null) {
    return null
  }

  return status
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      await fn(items[index])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  )
}

async function readPublicIntresseJson(): Promise<Response | null> {
  try {
    const { env } = await import('cloudflare:workers')
    if (env.ASSETS) {
      return env.ASSETS.fetch(
        new Request(new URL('/intresse.json', 'http://assets.local')),
      )
    }
  } catch {
    // Not running in a Workers runtime with ASSETS bound.
  }

  try {
    const { readFile } = await import('node:fs/promises')
    const { fileURLToPath } = await import('node:url')
    const raw = await readFile(
      fileURLToPath(new URL('../../public/intresse.json', import.meta.url)),
      'utf-8',
    )
    return new Response(raw, {
      headers: { 'content-type': 'application/json' },
    })
  } catch {
    return null
  }
}

const loadIntresseIndex = createIsomorphicFn()
  .client(async (): Promise<IntresseIndexFile> => {
    const response = await fetch(`${import.meta.env.BASE_URL}intresse.json`)
    if (!response.ok) {
      return EMPTY_INTRESSE_INDEX
    }
    return response.json() as Promise<IntresseIndexFile>
  })
  .server(async (): Promise<IntresseIndexFile> => {
    try {
      const response = await readPublicIntresseJson()
      if (!response?.ok) {
        return EMPTY_INTRESSE_INDEX
      }
      return response.json() as Promise<IntresseIndexFile>
    } catch {
      return EMPTY_INTRESSE_INDEX
    }
  })

export async function getIntresseIndex(): Promise<IntresseIndexFile> {
  return loadIntresseIndex()
}

export const getIntresseStatus = createServerFn({ method: 'GET' })
  .validator((refid: string) => refid)
  .handler(async ({ data: refid }): Promise<IntresseStatus | null> => {
    return fetchIntresseStatusForRefid(refid)
  })

export const refreshIntresseIndex = createServerFn({ method: 'POST' })
  .validator((refids: string[]) => refids)
  .handler(async ({ data: refids }): Promise<IntresseIndexFile> => {
    const data: Record<string, IntresseStatus> = {}
    let completed = 0

    await mapWithConcurrency(refids, 3, async (refid) => {
      try {
        const status = await fetchIntresseStatusForRefid(refid)
        if (status) {
          data[refid] = status
        }
      } catch {
        // Skip failed refids
      }

      completed += 1
      if (completed < refids.length) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    })

    return {
      fetchedAt: new Date().toISOString(),
      data,
    }
  })

