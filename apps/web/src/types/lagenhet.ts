export interface LagenhetBild {
  url: string
  text: string | null
}

export interface LagenhetEgenskap {
  id: string
  beskrivning: string
  beskrivningDetalj: string
  beskrivningKort: string
}

export interface Lagenhet {
  objektNr: string
  tinyObjektNr: string
  adress: string
  omrade: string
  omradeKod: string
  hyra: number
  hyraEnhet: string
  typ: string
  typOvergripande: string
  yta: number
  vaning: string
  antalVaningar: number | null
  inflyttningDatum: string
  inflyttningTidigareDatum: string | null
  detaljUrl: string
  refid: string
  hiss: boolean
  beskrivning: string
  poang: number
  egenskaper: LagenhetEgenskap[]
  bildUrl: string
  bilder: LagenhetBild[]
  publiceratDatum: string
  harIntresseanmaltsAvInloggadKund: boolean
  planlosningUrl: string | null
}
