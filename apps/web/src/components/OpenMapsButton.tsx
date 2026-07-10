import { useState } from 'react'
import { CheckIcon, ChevronDownIcon, CopyIcon, MapPinIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  buildAppleMapsUrl,
  buildGoogleEarthUrl,
  buildGoogleMapsUrl,
} from '@/lib/lagenheter'

const mapOptions = [
  { label: 'Google Maps', href: buildGoogleMapsUrl },
  { label: 'Apple Maps', href: buildAppleMapsUrl },
  { label: 'Google Earth', href: buildGoogleEarthUrl },
] as const

type OpenMapsButtonProps = {
  adress: string
}

export function OpenMapsButton({ adress }: OpenMapsButtonProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className="justify-between" />
        }
      >
        Öppna i kartor
        <span className="flex items-center gap-1">
          <MapPinIcon />
          <ChevronDownIcon className="text-muted-foreground" />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1">
        {mapOptions.map(({ label, href }) => (
          <MapOptionRow key={label} label={label} url={href(adress)} />
        ))}
      </PopoverContent>
    </Popover>
  )
}

type MapOptionRowProps = {
  label: string
  url: string
}

function MapOptionRow({ label, url }: MapOptionRowProps) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center rounded-md hover:bg-muted">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 px-2 py-1.5 text-sm"
      >
        {label}
      </a>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Kopiera ${label}-länk`}
        onClick={() => void copyLink()}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  )
}
