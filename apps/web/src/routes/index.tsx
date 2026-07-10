import { createFileRoute } from '@tanstack/react-router'
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table'
import { HeartIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { FavoriteLagenheterSheet } from '#/components/FavoriteLagenheterSheet'
import { LagenhetTable } from '#/components/LagenhetTable'
import { Button } from '@/components/ui/button'
import { useFavoriteLagenheter } from '#/hooks/useFavoriteLagenheter'
import {
  isEmptyLagenhetListSearch,
  lagenhetListSearchToTableState,
  loadLagenhetListSearch,
  parseLagenhetListSearch,
  saveLagenhetListSearch,
  tableStateToLagenhetListSearch,
} from '#/lib/lagenhet-filters'
import { saveListDetailReturn } from '#/lib/detail-return'
import { getLagenheter } from '#/lib/lagenheter'
import { pageTitle, site } from '#/lib/site'

export const Route = createFileRoute('/')({
  validateSearch: parseLagenhetListSearch,
  loader: () => getLagenheter(),
  head: () => ({
    meta: [
      {
        title: pageTitle('Lediga lägenheter'),
      },
      {
        name: 'description',
        content: site.description,
      },
    ],
  }),
  component: Home,
})

function Home() {
  const lagenheter = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const restoredFilters = useRef(false)
  const { favorites, isFavorite, toggleFavorite } = useFavoriteLagenheter()

  const { columnFilters, sorting, showOnlyFavorites } = useMemo(
    () => lagenhetListSearchToTableState(search),
    [search],
  )

  useEffect(() => {
    if (restoredFilters.current) return
    restoredFilters.current = true

    if (!isEmptyLagenhetListSearch(search)) {
      saveLagenhetListSearch(search)
      return
    }

    const stored = loadLagenhetListSearch()
    if (!stored) return

    navigate({ search: stored, replace: true })
  }, [navigate, search])

  const updateTableState = (
    nextColumnFilters: ColumnFiltersState,
    nextSorting: SortingState,
    nextShowOnlyFavorites: boolean,
  ) => {
    const nextSearch = tableStateToLagenhetListSearch(
      nextColumnFilters,
      nextSorting,
      nextShowOnlyFavorites,
    )

    saveLagenhetListSearch(nextSearch)
    navigate({ search: nextSearch, replace: true })
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">Lediga lägenheter</h1>
        <Button type="button" variant="outline" onClick={() => setSheetOpen(true)}>
          <HeartIcon className={favorites.length > 0 ? 'fill-red-500 text-red-500' : undefined} />
          Sparade
          {favorites.length > 0 && (
            <span className="text-muted-foreground">({favorites.length})</span>
          )}
        </Button>
      </div>
      <div className="mt-8">
        <LagenhetTable
          lagenheter={lagenheter}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          columnFilters={columnFilters}
          onColumnFiltersChange={(nextColumnFilters) =>
            updateTableState(nextColumnFilters, sorting, showOnlyFavorites)
          }
          sorting={sorting}
          onSortingChange={(nextSorting) =>
            updateTableState(columnFilters, nextSorting, showOnlyFavorites)
          }
          showOnlyFavorites={showOnlyFavorites}
          onShowOnlyFavoritesChange={(nextShowOnlyFavorites) =>
            updateTableState(columnFilters, sorting, nextShowOnlyFavorites)
          }
          onNavigateToDetail={() => saveListDetailReturn(search)}
        />
      </div>
      <FavoriteLagenheterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onShowInTable={() => {
          updateTableState(columnFilters, sorting, true)
          setSheetOpen(false)
        }}
        onNavigateToDetail={() => saveListDetailReturn(search)}
      />
    </div>
  )
}
