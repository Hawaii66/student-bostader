import { createFileRoute } from '@tanstack/react-router'

import { LagenhetListPage } from '#/components/LagenhetListPage'
import { parseLagenhetListSearch } from '#/lib/lagenhet-filters'
import { getLagenheter } from '#/lib/lagenheter'
import { pageTitle, site } from '#/lib/site'

export const Route = createFileRoute('/')({
  validateSearch: parseLagenhetListSearch,
  loader: () => getLagenheter(),
  preload: true,
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
  component: LagenhetListPage,
})
