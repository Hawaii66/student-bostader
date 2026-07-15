import { createFileRoute, notFound } from '@tanstack/react-router'

import { LagenhetDetail } from '#/components/LagenhetDetail'
import { getIntresseStatus } from '#/lib/intresse'
import { getLagenhet } from '#/lib/lagenheter'
import { pageTitle } from '#/lib/site'

export const Route = createFileRoute('/lagenhet/$objektNr')({
  loader: async ({ params }) => {
    const lagenhet = await getLagenhet(params.objektNr)
    if (!lagenhet) throw notFound()

    const intresseStatus = await getIntresseStatus({ data: lagenhet.refid }).catch(
      () => null,
    )

    return { lagenhet, intresseStatus }
  },
  head: ({ loaderData }) => {
    const lagenhet = loaderData?.lagenhet
    if (!lagenhet) return {}

    return {
      meta: [
        {
          title: pageTitle(lagenhet.adress),
        },
        {
          name: 'description',
          content: `${lagenhet.adress} i ${lagenhet.omrade}. ${lagenhet.yta} m², ${lagenhet.hyra} ${lagenhet.hyraEnhet}.`,
        },
      ],
    }
  },
  component: LagenhetDetailPage,
})

function LagenhetDetailPage() {
  const { lagenhet, intresseStatus } = Route.useLoaderData()

  return <LagenhetDetail lagenhet={lagenhet} intresseStatus={intresseStatus} />
}
