import { createFileRoute, notFound } from '@tanstack/react-router'

import { LagenhetDetail } from '#/components/LagenhetDetail'
import { getLagenhet } from '#/lib/lagenheter'

export const Route = createFileRoute('/lagenhet/$objektNr')({
  loader: async ({ params }) => {
    const lagenhet = await getLagenhet({ data: params.objektNr })
    if (!lagenhet) throw notFound()
    return lagenhet
  },
  component: LagenhetDetailPage,
})

function LagenhetDetailPage() {
  const lagenhet = Route.useLoaderData()

  return <LagenhetDetail lagenhet={lagenhet} />
}
