import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { KonkurrensView } from '#/components/KonkurrensView'
import {
  isEmptyKonkurrensSearch,
  loadKonkurrensSearch,
  parseKonkurrensSearch,
  saveKonkurrensSearch,
  type KonkurrensSearch,
} from '#/lib/konkurrens-state'
import { getIntresseIndex } from '#/lib/intresse'
import { getLagenheter } from '#/lib/lagenheter'
import { pageTitle } from '#/lib/site'

export const Route = createFileRoute('/konkurrens')({
  validateSearch: parseKonkurrensSearch,
  loader: async () => {
    const [lagenheter, intresseIndex] = await Promise.all([
      getLagenheter(),
      getIntresseIndex(),
    ])

    return { lagenheter, intresseIndex }
  },
  head: () => ({
    meta: [
      {
        title: pageTitle('Konkurrens'),
      },
      {
        name: 'description',
        content:
          'Se vilka köpoäng som anmält intresse på vilka lägenheter och hur bookbara dina sparade val är.',
      },
    ],
  }),
  component: KonkurrensPage,
})

function KonkurrensPage() {
  const { lagenheter, intresseIndex } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const restoredSearch = useRef(false)

  useEffect(() => {
    if (restoredSearch.current) return
    restoredSearch.current = true

    if (!isEmptyKonkurrensSearch(search)) {
      saveKonkurrensSearch(search)
      return
    }

    const stored = loadKonkurrensSearch()
    if (!stored) return

    navigate({ search: stored, replace: true })
  }, [navigate, search])

  const updateSearch = (nextSearch: KonkurrensSearch) => {
    saveKonkurrensSearch(nextSearch)
    navigate({ search: nextSearch, replace: true })
  }

  return (
    <KonkurrensView
      lagenheter={lagenheter}
      initialIntresseIndex={intresseIndex}
      search={search}
      onSearchChange={updateSearch}
    />
  )
}
