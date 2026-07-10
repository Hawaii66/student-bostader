import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, ExternalLinkIcon, HeartIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { LagenhetBildGalleri } from '@/components/LagenhetBildGalleri'
import { LagenhetPlanlosningSheet } from '@/components/LagenhetPlanlosningSheet'
import { OpenMapsButton } from '@/components/OpenMapsButton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFavoriteLagenheter } from '#/hooks/useFavoriteLagenheter'
import { buildStudentbostaderDetaljUrl } from '@/lib/lagenheter'
import { loadLagenhetListSearch, type LagenhetListSearch } from '#/lib/lagenhet-filters'
import type { IntresseStatus } from '#/types/intresse'
import type { Lagenhet } from '#/types/lagenhet'

const numberFormatter = new Intl.NumberFormat('sv-SE')
const dateFormatter = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'long' })

type LagenhetDetailProps = {
  lagenhet: Lagenhet
  intresseStatus: IntresseStatus | null
}

export function LagenhetDetail({ lagenhet, intresseStatus }: LagenhetDetailProps) {
  const [listSearch, setListSearch] = useState<LagenhetListSearch>({})
  const { isFavorite, toggleFavorite } = useFavoriteLagenheter()
  const favorited = isFavorite(lagenhet.objektNr)

  useEffect(() => {
    setListSearch(loadLagenhetListSearch() ?? {})
  }, [])

  const bilder =
    lagenhet.bilder.length > 0
      ? lagenhet.bilder
      : [{ url: lagenhet.bildUrl, text: lagenhet.adress }]

  return (
    <div className="mx-auto max-w-5xl p-8">
      <Link
        to="/"
        search={listSearch}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Tillbaka till listan
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <LagenhetBildGalleri bilder={bilder} adress={lagenhet.adress} />

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{lagenhet.omrade}</p>
            <h1 className="mt-1 text-3xl font-bold">{lagenhet.adress}</h1>
            <p className="mt-2 text-muted-foreground">
              {lagenhet.typ}
              {lagenhet.vaning ? ` · Våning ${lagenhet.vaning}` : ''}
              {lagenhet.antalVaningar ? ` av ${lagenhet.antalVaningar}` : ''}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-4 rounded-xl border p-4">
            <DetailItem label="Hyra">
              {numberFormatter.format(lagenhet.hyra)} {lagenhet.hyraEnhet}
            </DetailItem>
            <DetailItem label="Storlek">{lagenhet.yta} m²</DetailItem>
            <DetailItem label="Max poäng">
              {numberFormatter.format(lagenhet.poang)} p
            </DetailItem>
            <DetailItem label="Hiss">{lagenhet.hiss ? 'Ja' : 'Nej'}</DetailItem>
            <DetailItem label="Inflyttning">
              {formatDate(lagenhet.inflyttningDatum)}
            </DetailItem>
            {lagenhet.inflyttningTidigareDatum && (
              <DetailItem label="Tidigare inflyttning">
                {formatDate(lagenhet.inflyttningTidigareDatum)}
              </DetailItem>
            )}
            <DetailItem label="Publicerad">
              {formatDate(lagenhet.publiceratDatum)}
            </DetailItem>
            <DetailItem label="Objektnr">{lagenhet.objektNr}</DetailItem>
          </dl>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              aria-label={favorited ? 'Ta bort från sparade' : 'Spara lägenhet'}
              aria-pressed={favorited}
              onClick={() => toggleFavorite(lagenhet)}
            >
              <HeartIcon className={cn(favorited && 'fill-red-500 text-red-500')} />
              {favorited ? 'Sparad' : 'Spara'}
            </Button>
            <Button
              render={
                <a
                  href={buildStudentbostaderDetaljUrl(lagenhet.refid)}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              Visa på Studentbostäder
              <ExternalLinkIcon />
            </Button>
            <OpenMapsButton adress={lagenhet.adress} />
            {lagenhet.planlosningUrl && (
              <LagenhetPlanlosningSheet
                planlosningUrl={lagenhet.planlosningUrl}
                adress={lagenhet.adress}
              />
            )}
          </div>

          {intresseStatus && intresseStatus.topPoang.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">Topp 5 köpoäng</h2>
              {intresseStatus.antalIntresseanmalningar !== null && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {numberFormatter.format(intresseStatus.antalIntresseanmalningar)} personer har
                  anmält intresse
                </p>
              )}
              <ol className="mt-3 space-y-2">
                {intresseStatus.topPoang.map((poang, index) => (
                  <li
                    key={`${index}-${poang}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span className="font-medium">{numberFormatter.format(poang)} p</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {lagenhet.beskrivning && (
            <section>
              <h2 className="text-lg font-semibold">Beskrivning</h2>
              <div
                className="mt-2 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: lagenhet.beskrivning }}
              />
            </section>
          )}

          {lagenhet.egenskaper.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">Egenskaper</h2>
              <ul className="mt-3 space-y-2">
                {lagenhet.egenskaper.map((egenskap) => (
                  <li
                    key={egenskap.id}
                    className="rounded-lg border px-3 py-2 text-sm"
                    title={stripHtml(egenskap.beskrivningDetalj) || undefined}
                  >
                    <span className="font-medium">{egenskap.beskrivningKort || egenskap.beskrivning}</span>
                    {egenskap.beskrivningDetalj && (
                      <div
                        className="mt-0.5 text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: egenskap.beskrivningDetalj }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

type DetailItemProps = {
  label: string
  children: React.ReactNode
}

function DetailItem({ label, children }: DetailItemProps) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 font-medium">{children}</dd>
    </div>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return dateFormatter.format(date)
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
