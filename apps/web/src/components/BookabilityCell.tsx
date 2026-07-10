import { PreviewCard } from '@base-ui/react/preview-card'

import { cn } from '@/lib/utils'
import {
  formatBookabilityScoreValue,
  getBookabilitySummaryLines,
  hasRealIntresse,
} from '#/lib/konkurrens'
import type { LagenhetKonkurrens } from '#/types/konkurrens'

const numberFormatter = new Intl.NumberFormat('sv-SE')

type BookabilityCellProps = {
  item: LagenhetKonkurrens
  userPoang?: number | null
}

export function BookabilityCell({ item, userPoang }: BookabilityCellProps) {
  const topPoang = item.intresseStatus?.topPoang ?? []
  const summaryLines = getBookabilitySummaryLines(item, userPoang)

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger className="cursor-help underline decoration-dotted underline-offset-4">
        {formatBookabilityScore(item.bookabilityScore)}
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner side="top" sideOffset={8} className="z-50">
          <PreviewCard.Popup
            className={cn(
              'w-72 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-md',
              'origin-(--transform-origin) transition-[transform,scale,opacity]',
              'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            )}
          >
            <p className="font-medium">Topp 5 köpoäng</p>
            {!hasRealIntresse(topPoang) ? (
              <p className="mt-2 text-muted-foreground">
                Ingen har anmält intresse ännu. 0 p är systemets standard och räknas inte som en
                riktig person.
              </p>
            ) : (
              <ol className="mt-2 space-y-1.5">
                {item.topCompetitors.map((competitor) => (
                  <li
                    key={`${competitor.rank}-${competitor.poang}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-muted-foreground">{competitor.rank}.</span>
                    <span className="font-medium">{numberFormatter.format(competitor.poang)} p</span>
                    <span className="text-xs text-muted-foreground">
                      {competitor.spreadCount >= 2
                        ? `spridd (${competitor.spreadCount})`
                        : 'dedikerad'}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-3 border-t pt-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                Bokbarhetspoäng: {formatBookabilityScoreValue(item.bookabilityScore)}
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {summaryLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  )
}

function formatBookabilityScore(score: number): string {
  const label = formatBookabilityScoreValue(score)
  if (score >= 5) return `Hög (${label})`
  if (score >= 0) return `Medel (${label})`
  return `Låg (${label})`
}
