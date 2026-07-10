import { HeartIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { withBildDimensions } from '@/lib/bilder'
import { cn } from '@/lib/utils'
import type { Lagenhet } from '#/types/lagenhet'

const numberFormatter = new Intl.NumberFormat('sv-SE')

type FavoriteLagenheterSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  favorites: Lagenhet[]
  onToggleFavorite: (lagenhet: Lagenhet) => void
}

export function FavoriteLagenheterSheet({
  open,
  onOpenChange,
  favorites,
  onToggleFavorite,
}: FavoriteLagenheterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Sparade lägenheter</SheetTitle>
          <SheetDescription>
            {favorites.length === 0
              ? 'Du har inga sparade lägenheter ännu.'
              : `${favorites.length} sparad${favorites.length === 1 ? '' : 'e'} lägenhet${favorites.length === 1 ? '' : 'er'}.`}
          </SheetDescription>
        </SheetHeader>

        {favorites.length > 0 && (
          <ul className="flex flex-col gap-3 px-4 pb-4">
            {favorites.map((lagenhet) => (
              <li
                key={lagenhet.objektNr}
                className="flex gap-3 rounded-lg border p-3"
              >
                <img
                  src={withBildDimensions(lagenhet.bildUrl, 224, 160)}
                  alt={lagenhet.adress}
                  className="h-20 w-28 shrink-0 rounded-md object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{lagenhet.omrade}</p>
                  <p className="truncate text-sm text-muted-foreground">{lagenhet.adress}</p>
                  <p className="mt-1 text-sm">
                    {numberFormatter.format(lagenhet.hyra)} {lagenhet.hyraEnhet} ·{' '}
                    {lagenhet.yta} m² · {numberFormatter.format(lagenhet.poang)} p
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Ta bort ${lagenhet.adress} från sparade`}
                  onClick={() => onToggleFavorite(lagenhet)}
                  className="shrink-0"
                >
                  <HeartIcon className={cn('fill-red-500 text-red-500')} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}
