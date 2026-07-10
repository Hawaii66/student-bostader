import { useCallback, useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { withBildDimensions } from '@/lib/bilder'
import { cn } from '@/lib/utils'
import type { LagenhetBild } from '#/types/lagenhet'

type LagenhetBildGalleriProps = {
  bilder: LagenhetBild[]
  adress: string
}

export function LagenhetBildGalleri({ bilder, adress }: LagenhetBildGalleriProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const activeBild = bilder[activeIndex]
  const hasMultiple = bilder.length > 1

  const openAt = (index: number) => {
    setActiveIndex(index)
    setOpen(true)
  }

  const goPrev = useCallback(() => {
    setActiveIndex((index) => (index === 0 ? bilder.length - 1 : index - 1))
  }, [bilder.length])

  const goNext = useCallback(() => {
    setActiveIndex((index) => (index === bilder.length - 1 ? 0 : index + 1))
  }, [bilder.length])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goPrev()
      else if (event.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, goPrev, goNext])

  return (
    <>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="block w-full cursor-zoom-in overflow-hidden rounded-xl border text-left"
        >
          <img
            src={withBildDimensions(bilder[0].url, 960, 720)}
            alt={bilder[0].text ?? adress}
            className="aspect-[4/3] w-full object-cover"
          />
        </button>

        {hasMultiple && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {bilder.slice(1).map((bild, index) => (
              <button
                key={`${bild.url}-${index}`}
                type="button"
                onClick={() => openAt(index + 1)}
                className="cursor-zoom-in overflow-hidden rounded-lg border text-left"
              >
                <img
                  src={withBildDimensions(bild.url, 640, 360)}
                  alt={bild.text ?? adress}
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 border-none bg-transparent p-0 shadow-none sm:max-w-5xl"
        >
          <DialogTitle className="sr-only">Bildgalleri</DialogTitle>
          <DialogDescription className="sr-only">
            Bild {activeIndex + 1} av {bilder.length}
          </DialogDescription>

          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                />
              }
            >
              <XIcon />
              <span className="sr-only">Stäng</span>
            </DialogClose>

            {hasMultiple && (
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={goPrev}
                className="absolute top-1/2 left-2 z-10 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 hover:text-white"
              >
                <ChevronLeftIcon />
                <span className="sr-only">Föregående bild</span>
              </Button>
            )}

            <img
              src={withBildDimensions(activeBild.url, 1920, 1440)}
              alt={activeBild.text ?? adress}
              className="max-h-[calc(100vh-8rem)] w-full rounded-lg object-contain"
            />

            {hasMultiple && (
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={goNext}
                className="absolute top-1/2 right-2 z-10 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 hover:text-white"
              >
                <ChevronRightIcon />
                <span className="sr-only">Nästa bild</span>
              </Button>
            )}
          </div>

          <div className="mt-3 flex flex-col items-center gap-2">
            {hasMultiple && (
              <p className="text-sm text-white/80">
                {activeIndex + 1} / {bilder.length}
              </p>
            )}

            {hasMultiple && (
              <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                {bilder.map((bild, index) => (
                  <button
                    key={`${bild.url}-thumb-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      'shrink-0 overflow-hidden rounded-md border-2 transition-opacity',
                      index === activeIndex
                        ? 'border-white opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-100',
                    )}
                  >
                    <img
                      src={withBildDimensions(bild.url, 160, 120)}
                      alt={bild.text ?? adress}
                      className="size-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {activeBild.text && (
              <p className="max-w-lg text-center text-sm text-white/80">{activeBild.text}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
