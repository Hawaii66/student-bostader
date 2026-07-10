import type { ColumnFiltersState, SortingState } from '@tanstack/react-table'

const STORAGE_KEY = 'lagenhet-list-filters'

export type LagenhetListSearch = {
  omrade?: string[]
  typ?: string[]
  adress?: string
  hyraMin?: number
  hyraMax?: number
  ytaMin?: number
  ytaMax?: number
  poangMin?: number
  poangMax?: number
  sparade?: boolean
  sort?: string
}

type RangeFilterValue = {
  min?: number
  max?: number
}

function parseCsv(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    return items.length ? items : undefined
  }

  if (typeof value !== 'string' || !value) return undefined
  const items = value.split(',').map((item) => item.trim()).filter(Boolean)
  return items.length ? items : undefined
}

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true' || value === '1') return true
  return undefined
}

export function parseLagenhetListSearch(search: Record<string, unknown>): LagenhetListSearch {
  const omrade = parseCsv(search.omrade)
  const typ = parseCsv(search.typ)

  return {
    omrade,
    typ,
    adress: typeof search.adress === 'string' && search.adress ? search.adress : undefined,
    hyraMin: parseNumber(search.hyraMin),
    hyraMax: parseNumber(search.hyraMax),
    ytaMin: parseNumber(search.ytaMin),
    ytaMax: parseNumber(search.ytaMax),
    poangMin: parseNumber(search.poangMin),
    poangMax: parseNumber(search.poangMax),
    sparade: parseBoolean(search.sparade),
    sort: typeof search.sort === 'string' && search.sort ? search.sort : undefined,
  }
}

export function isEmptyLagenhetListSearch(search: LagenhetListSearch): boolean {
  return (
    !search.omrade?.length &&
    !search.typ?.length &&
    !search.adress &&
    search.hyraMin === undefined &&
    search.hyraMax === undefined &&
    search.ytaMin === undefined &&
    search.ytaMax === undefined &&
    search.poangMin === undefined &&
    search.poangMax === undefined &&
    !search.sparade &&
    !search.sort
  )
}

export function lagenhetListSearchToTableState(search: LagenhetListSearch): {
  columnFilters: ColumnFiltersState
  sorting: SortingState
  showOnlyFavorites: boolean
} {
  const columnFilters: ColumnFiltersState = []

  if (search.omrade?.length) {
    columnFilters.push({ id: 'omrade', value: search.omrade })
  }

  if (search.typ?.length) {
    columnFilters.push({ id: 'typOvergripande', value: search.typ })
  }

  if (search.adress) {
    columnFilters.push({ id: 'adress', value: search.adress })
  }

  if (search.hyraMin !== undefined || search.hyraMax !== undefined) {
    columnFilters.push({
      id: 'hyra',
      value: { min: search.hyraMin, max: search.hyraMax } satisfies RangeFilterValue,
    })
  }

  if (search.ytaMin !== undefined || search.ytaMax !== undefined) {
    columnFilters.push({
      id: 'yta',
      value: { min: search.ytaMin, max: search.ytaMax } satisfies RangeFilterValue,
    })
  }

  if (search.poangMin !== undefined || search.poangMax !== undefined) {
    columnFilters.push({
      id: 'poang',
      value: { min: search.poangMin, max: search.poangMax } satisfies RangeFilterValue,
    })
  }

  const sorting: SortingState = []
  if (search.sort) {
    const [id, direction] = search.sort.split(':')
    if (id) {
      sorting.push({ id, desc: direction === 'desc' })
    }
  }

  return {
    columnFilters,
    sorting,
    showOnlyFavorites: search.sparade === true,
  }
}

export function tableStateToLagenhetListSearch(
  columnFilters: ColumnFiltersState,
  sorting: SortingState,
  showOnlyFavorites: boolean,
): LagenhetListSearch {
  const search: LagenhetListSearch = {}

  for (const filter of columnFilters) {
    const value = filter.value
    if (value === undefined || value === '' || value === null) continue

    if (filter.id === 'omrade' && Array.isArray(value) && value.length) {
      search.omrade = value
      continue
    }

    if (filter.id === 'typOvergripande' && Array.isArray(value) && value.length) {
      search.typ = value
      continue
    }

    if (filter.id === 'adress' && typeof value === 'string') {
      search.adress = value
      continue
    }

    if (filter.id === 'hyra' || filter.id === 'yta' || filter.id === 'poang') {
      const range = value as RangeFilterValue
      if (filter.id === 'hyra') {
        if (range.min !== undefined) search.hyraMin = range.min
        if (range.max !== undefined) search.hyraMax = range.max
      } else if (filter.id === 'yta') {
        if (range.min !== undefined) search.ytaMin = range.min
        if (range.max !== undefined) search.ytaMax = range.max
      } else {
        if (range.min !== undefined) search.poangMin = range.min
        if (range.max !== undefined) search.poangMax = range.max
      }
    }
  }

  if (showOnlyFavorites) {
    search.sparade = true
  }

  const activeSort = sorting[0]
  if (activeSort) {
    search.sort = `${activeSort.id}:${activeSort.desc ? 'desc' : 'asc'}`
  }

  return search
}

export function saveLagenhetListSearch(search: LagenhetListSearch): void {
  if (typeof window === 'undefined') return

  if (isEmptyLagenhetListSearch(search)) {
    sessionStorage.removeItem(STORAGE_KEY)
    return
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(search))
}

export function loadLagenhetListSearch(): LagenhetListSearch | undefined {
  if (typeof window === 'undefined') return undefined

  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return undefined

  try {
    const parsed = parseLagenhetListSearch(JSON.parse(raw) as Record<string, unknown>)
    return isEmptyLagenhetListSearch(parsed) ? undefined : parsed
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return undefined
  }
}
