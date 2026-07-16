import { type ErrorComponentProps } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

function isChunkLoadError(error: Error): boolean {
  return (
    error.message.includes('dynamically imported module') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('Importing a module script failed')
  )
}

export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  const chunkError = isChunkLoadError(error)

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-8">
      <div>
        <h1 className="text-xl font-semibold">Något gick fel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {chunkError
            ? 'Sidans kod kunde inte laddas. Det händer ibland i utvecklingsläge efter filändringar.'
            : error.message}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => reset()}>
          Försök igen
        </Button>
        {chunkError && (
          <Button type="button" onClick={() => window.location.reload()}>
            Ladda om sidan
          </Button>
        )}
      </div>
    </div>
  )
}
