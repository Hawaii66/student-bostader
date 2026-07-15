import { createFileRoute } from '@tanstack/react-router'

import { PlayoffView } from '#/components/PlayoffView'
import { getIntresseIndex } from '#/lib/intresse'
import { getLagenheter } from '#/lib/lagenheter'
import { pageTitle } from '#/lib/site'

export const Route = createFileRoute('/playoff')({
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
        title: pageTitle('Playoff'),
      },
      {
        name: 'description',
        content:
          'Simulera fördelning av lägenheter efter köpoäng och intresseanmälningar.',
      },
    ],
  }),
  component: PlayoffPage,
})

function PlayoffPage() {
  const { lagenheter, intresseIndex } = Route.useLoaderData()

  return <PlayoffView lagenheter={lagenheter} initialIntresseIndex={intresseIndex} />
}
