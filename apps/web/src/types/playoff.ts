import type { VirtualUserPlacement } from '#/types/konkurrens'

export type PlayoffParticipant = {
  poang: number
  placements: VirtualUserPlacement[]
  isCurrentUser?: boolean
}

export type PlayoffPickReason = 'only_choice' | 'highest_competition'

export type PlayoffAlternative = {
  placement: VirtualUserPlacement
  competition: number
}

export type PlayoffAssignment = {
  step: number
  participant: PlayoffParticipant
  assigned: VirtualUserPlacement | null
  alternatives: PlayoffAlternative[]
  pickReason: PlayoffPickReason | null
}

export type PlayoffResult = {
  assignments: PlayoffAssignment[]
  unassignedParticipants: PlayoffParticipant[]
  unassignedApartments: VirtualUserPlacement[]
}

export type FavoriteApartmentOutcome = {
  placement: VirtualUserPlacement
  winnerPoang: number | null
  winnerStep: number | null
  isCurrentUserWinner: boolean
  status: 'you' | 'other' | 'unassigned'
}
