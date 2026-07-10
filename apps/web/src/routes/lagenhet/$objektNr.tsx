import { createFileRoute, notFound } from '@tanstack/react-router'

import { LagenhetDetail } from '#/components/LagenhetDetail'
import { getIntresseStatus } from '#/lib/intresse'
import { getLagenhet } from '#/lib/lagenheter'

export const Route = createFileRoute('/lagenhet/$objektNr')({
  loader: async ({ params }) => {
    const lagenhet = await getLagenhet(params.objektNr)
    if (!lagenhet) throw notFound()

    const intresseStatus = await getIntresseStatus({ data: lagenhet.refid }).catch(
      () => null,
    )

    return { lagenhet, intresseStatus }
  },
  component: LagenhetDetailPage,
})

function LagenhetDetailPage() {
  const { lagenhet, intresseStatus } = Route.useLoaderData()

  return <LagenhetDetail lagenhet={lagenhet} intresseStatus={intresseStatus} />
}
