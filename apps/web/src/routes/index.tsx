import { createFileRoute } from '@tanstack/react-router'
import { HeartIcon } from 'lucide-react'
import { useState } from 'react'

import { FavoriteLagenheterSheet } from '#/components/FavoriteLagenheterSheet'
import { LagenhetTable } from '#/components/LagenhetTable'
import { Button } from '@/components/ui/button'
import { useFavoriteLagenheter } from '#/hooks/useFavoriteLagenheter'
import { getLagenheter } from '#/lib/lagenheter'

export const Route = createFileRoute('/')({
  loader: () => getLagenheter(),
  component: Home,
})

function Home() {
  const lagenheter = Route.useLoaderData()
  const [sheetOpen, setSheetOpen] = useState(false)
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
        />
      </div>
      <FavoriteLagenheterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  )
}
