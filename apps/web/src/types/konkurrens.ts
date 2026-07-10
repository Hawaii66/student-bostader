import type { IntresseStatus } from '#/types/intresse'
import type { Lagenhet } from '#/types/lagenhet'

export type VirtualUserPlacement = {
  objektNr: string
  adress: string
  omrade: string
  rank: number
  antalIntresse: number | null
}

export type VirtualUser = {
  poang: number
  placements: VirtualUserPlacement[]
}

export type TopCompetitor = {
  poang: number
  rank: number
  spreadCount: number
}

export type LagenhetKonkurrens = {
  lagenhet: Lagenhet
  intresseStatus: IntresseStatus | null
  topCompetitors: TopCompetitor[]
  bookabilityScore: number
  spreadCount: number
  dedicatedCount: number
  userWouldRank: number | null
  userBeatsAll: boolean
}

export type KonkurrensResult = {
  virtualUsers: VirtualUser[]
  lagenhetKonkurrens: LagenhetKonkurrens[]
}
