import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, ExternalLinkIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Lagenhet } from '#/types/lagenhet'

const numberFormatter = new Intl.NumberFormat('sv-SE')
const dateFormatter = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'long' })

type LagenhetDetailProps = {
  lagenhet: Lagenhet
}

export function LagenhetDetail({ lagenhet }: LagenhetDetailProps) {
  const bilder =
    lagenhet.bilder.length > 0
      ? lagenhet.bilder
      : [{ url: lagenhet.bildUrl, text: lagenhet.adress }]

  return (
    <div className="mx-auto max-w-5xl p-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Tillbaka till listan
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border">
            <img
              src={bilder[0].url}
              alt={bilder[0].text ?? lagenhet.adress}
              className="aspect-[4/3] w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {bilder.length > 1 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {bilder.slice(1).map((bild, index) => (
                <div key={`${bild.url}-${index}`} className="overflow-hidden rounded-lg border">
                  <img
                    src={bild.url}
                    alt={bild.text ?? lagenhet.adress}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

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

          <Button render={<a href={lagenhet.detaljUrl} target="_blank" rel="noopener noreferrer" />}>
            Visa på Studentbostäder
            <ExternalLinkIcon />
          </Button>
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
