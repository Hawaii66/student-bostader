import { createFileRoute } from '@tanstack/react-router'

import { LagenhetTable } from '#/components/LagenhetTable'
import { getLagenheter } from '#/lib/lagenheter'

export const Route = createFileRoute('/')({
  loader: () => getLagenheter(),
  component: Home,
})

function Home() {
  const lagenheter = Route.useLoaderData()

  return (
    <div className="mx-auto max-w-7xl p-8">
      <h1 className="text-4xl font-bold">Lediga lägenheter</h1>
      <p className="mt-2 text-gray-600">
        {lagenheter.length} lägenheter tillgängliga
      </p>
      <div className="mt-8">
        <LagenhetTable lagenheter={lagenheter} />
      </div>
    </div>
  )
}
