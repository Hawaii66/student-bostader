import { useCallback, useEffect, useState } from 'react'

import type { Lagenhet } from '#/types/lagenhet'

const STORAGE_KEY = 'favorite-lagenheter'
const UPDATE_EVENT = 'favorite-lagenheter-updated'

function readFavorites(): Lagenhet[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Lagenhet[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeFavorites(favorites: Lagenhet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

export function useFavoriteLagenheter() {
  const [favorites, setFavorites] = useState<Lagenhet[]>([])

  useEffect(() => {
    setFavorites(readFavorites())

    const sync = () => setFavorites(readFavorites())
    window.addEventListener(UPDATE_EVENT, sync)
    window.addEventListener('storage', sync)

    return () => {
      window.removeEventListener(UPDATE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const isFavorite = useCallback(
    (objektNr: string) => favorites.some((lagenhet) => lagenhet.objektNr === objektNr),
    [favorites],
  )

  const toggleFavorite = useCallback(
    (lagenhet: Lagenhet) => {
      const next = isFavorite(lagenhet.objektNr)
        ? favorites.filter((item) => item.objektNr !== lagenhet.objektNr)
        : [...favorites, lagenhet]

      setFavorites(next)
      writeFavorites(next)
    },
    [favorites, isFavorite],
  )

  const removeFavorite = useCallback(
    (objektNr: string) => {
      const next = favorites.filter((lagenhet) => lagenhet.objektNr !== objektNr)
      setFavorites(next)
      writeFavorites(next)
    },
    [favorites],
  )

  return { favorites, isFavorite, toggleFavorite, removeFavorite }
}
