import { createFileRoute } from '@tanstack/react-router'
import { HeartIcon } from 'lucide-react'
import { useState } from 'react'

import { FavoriteLagenheterSheet } from '#/components/FavoriteLagenheterSheet'
import { LagenhetTable } from '#/components/LagenhetTable'
import { Button } from '@/components/ui/button'
import { useFavoriteLagenheter } from '#/hooks/useFavoriteLagenheter'
import { getLagenheter } from '#/lib/lagenheter'
import { pageTitle, site } from '#/lib/site'

export const Route = createFileRoute('/')({
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
  const [sheetOpen, setSheetOpen] = useState(false)
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const { favorites, isFavorite, toggleFavorite } = useFavoriteLagenheter()

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
          showOnlyFavorites={showOnlyFavorites}
          onShowOnlyFavoritesChange={setShowOnlyFavorites}
        />
      </div>
      <FavoriteLagenheterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onShowInTable={() => {
          setShowOnlyFavorites(true)
          setSheetOpen(false)
        }}
      />
    </div>
  )
}
