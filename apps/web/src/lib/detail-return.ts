import {
  parseLagenhetListSearch,
  type LagenhetListSearch,
} from '#/lib/lagenhet-filters'
import { parseKonkurrensSearch, type KonkurrensSearch } from '#/lib/konkurrens-state'

export type DetailReturn =
  | { to: '/konkurrens'; search: KonkurrensSearch }
  | { to: '/playoff'; search: Record<string, never> }
  | { to: '/'; search: LagenhetListSearch }

const DETAIL_RETURN_KEY = 'lagenhet-detail-return'

export function saveDetailReturn(returnTo: DetailReturn): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(DETAIL_RETURN_KEY, JSON.stringify(returnTo))
}

export function saveListDetailReturn(search: LagenhetListSearch): void {
  saveDetailReturn({ to: '/', search })
}

export function saveKonkurrensDetailReturn(search: KonkurrensSearch): void {
  saveDetailReturn({ to: '/konkurrens', search })
}

export function savePlayoffDetailReturn(): void {
  saveDetailReturn({ to: '/playoff', search: {} })
}

export function loadDetailReturn(): DetailReturn | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(DETAIL_RETURN_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as DetailReturn
    if (parsed.to === '/konkurrens') {
      return {
        to: '/konkurrens',
        search: parseKonkurrensSearch((parsed.search ?? {}) as Record<string, unknown>),
      }
    }

    if (parsed.to === '/playoff') {
      return { to: '/playoff', search: {} }
    }

    if (parsed.to === '/') {
      return {
        to: '/',
        search: parseLagenhetListSearch((parsed.search ?? {}) as Record<string, unknown>),
      }
    }

    return null
  } catch {
    sessionStorage.removeItem(DETAIL_RETURN_KEY)
    return null
  }
}

export function getDetailBackLabel(to: DetailReturn['to']): string {
  if (to === '/konkurrens') return 'Tillbaka till konkurrens'
  if (to === '/playoff') return 'Tillbaka till playoff'
  return 'Tillbaka till lediga lägenheter'
}
