import type { IntresseIndexFile } from '#/types/intresse'

export type KonkurrensSearch = {
  sort?: string
  alla?: boolean
}

export type VirtualUserSortField = 'poang' | 'placements'

export type VirtualUserSort = {
  field: VirtualUserSortField
  direction: 'asc' | 'desc'
}

const KONKURRENS_SEARCH_KEY = 'konkurrens-search'
export const INTRESSE_INDEX_KEY = 'intresse-index'
export const USER_POANG_KEY = 'user-poang'

const DEFAULT_SORT: VirtualUserSort = {
  field: 'placements',
  direction: 'desc',
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true' || value === '1') return true
  return undefined
}

export function parseKonkurrensSearch(search: Record<string, unknown>): KonkurrensSearch {
  return {
    sort: typeof search.sort === 'string' && search.sort ? search.sort : undefined,
    alla: parseBoolean(search.alla),
  }
}

export function isEmptyKonkurrensSearch(search: KonkurrensSearch): boolean {
  return !search.sort && !search.alla
}

export function konkurrensSearchToState(search: KonkurrensSearch): {
  virtualUserSort: VirtualUserSort
  showAllLagenheter: boolean
} {
  const virtualUserSort = parseVirtualUserSort(search.sort)
  return {
    virtualUserSort,
    showAllLagenheter: search.alla === true,
  }
}

export function stateToKonkurrensSearch(
  virtualUserSort: VirtualUserSort,
  showAllLagenheter: boolean,
): KonkurrensSearch {
  const search: KonkurrensSearch = {}

  const defaultSortString = `${DEFAULT_SORT.field}:${DEFAULT_SORT.direction}`
  const sortString = `${virtualUserSort.field}:${virtualUserSort.direction}`
  if (sortString !== defaultSortString) {
    search.sort = sortString
  }

  if (showAllLagenheter) {
    search.alla = true
  }

  return search
}

function parseVirtualUserSort(value: string | undefined): VirtualUserSort {
  if (!value) return DEFAULT_SORT

  const [field, direction] = value.split(':')
  if (field !== 'poang' && field !== 'placements') return DEFAULT_SORT
  if (direction !== 'asc' && direction !== 'desc') return DEFAULT_SORT

  return { field, direction }
}

export function saveKonkurrensSearch(search: KonkurrensSearch): void {
  if (typeof window === 'undefined') return

  if (isEmptyKonkurrensSearch(search)) {
    sessionStorage.removeItem(KONKURRENS_SEARCH_KEY)
    return
  }

  sessionStorage.setItem(KONKURRENS_SEARCH_KEY, JSON.stringify(search))
}

export function loadKonkurrensSearch(): KonkurrensSearch | undefined {
  if (typeof window === 'undefined') return undefined

  const raw = sessionStorage.getItem(KONKURRENS_SEARCH_KEY)
  if (!raw) return undefined

  try {
    const parsed = parseKonkurrensSearch(JSON.parse(raw) as Record<string, unknown>)
    return isEmptyKonkurrensSearch(parsed) ? undefined : parsed
  } catch {
    sessionStorage.removeItem(KONKURRENS_SEARCH_KEY)
    return undefined
  }
}

export function loadStoredIntresseIndex(): IntresseIndexFile | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(INTRESSE_INDEX_KEY)
    if (!raw) return null
    return JSON.parse(raw) as IntresseIndexFile
  } catch {
    localStorage.removeItem(INTRESSE_INDEX_KEY)
    return null
  }
}

export function saveStoredIntresseIndex(index: IntresseIndexFile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(INTRESSE_INDEX_KEY, JSON.stringify(index))
}

export function pickIntresseIndex(
  serverIndex: IntresseIndexFile,
  storedIndex: IntresseIndexFile | null,
): IntresseIndexFile {
  if (!storedIndex) return serverIndex

  const serverTime = Date.parse(serverIndex.fetchedAt)
  const storedTime = Date.parse(storedIndex.fetchedAt)

  if (Number.isNaN(storedTime)) return serverIndex
  if (Number.isNaN(serverTime) || storedTime >= serverTime) return storedIndex

  return serverIndex
}

export function loadUserPoang(): string {
  if (typeof window === 'undefined') return ''

  try {
    return localStorage.getItem(USER_POANG_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveUserPoang(value: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_POANG_KEY, value)
}
