import { buildVirtualUsers, calculateUserWouldRank } from '#/lib/konkurrens'
import type { VirtualUser, VirtualUserPlacement } from '#/types/konkurrens'
import type { IntresseStatus } from '#/types/intresse'
import type { Lagenhet } from '#/types/lagenhet'
import type {
  PlayoffAlternative,
  PlayoffAssignment,
  PlayoffParticipant,
  PlayoffPickReason,
  PlayoffResult,
  FavoriteApartmentOutcome,
} from '#/types/playoff'

function placementKey(placement: VirtualUserPlacement): string {
  return placement.objektNr
}

function mergePlacements(
  existing: VirtualUserPlacement[],
  incoming: VirtualUserPlacement[],
): VirtualUserPlacement[] {
  const byObjektNr = new Map<string, VirtualUserPlacement>()

  for (const placement of existing) {
    byObjektNr.set(placementKey(placement), placement)
  }

  for (const placement of incoming) {
    const key = placementKey(placement)
    const current = byObjektNr.get(key)
    if (!current) {
      byObjektNr.set(key, placement)
      continue
    }

    if (
      placement.rank != null &&
      (current.rank == null || placement.rank < current.rank)
    ) {
      byObjektNr.set(key, { ...current, rank: placement.rank })
    }
  }

  return [...byObjektNr.values()]
}

function virtualUserToParticipant(user: VirtualUser): PlayoffParticipant {
  return {
    poang: user.poang,
    placements: user.placements,
  }
}

function buildFavoritePlacements(
  favorites: Lagenhet[],
  intresseIndex: Record<string, IntresseStatus>,
  userPoang: number,
): VirtualUserPlacement[] {
  return favorites.map((lagenhet) => {
    const status = intresseIndex[lagenhet.refid]
    const topPoang = status?.topPoang ?? []
    const rank = status ? calculateUserWouldRank(userPoang, topPoang) : null

    return {
      objektNr: lagenhet.objektNr,
      adress: lagenhet.adress,
      omrade: lagenhet.omrade,
      rank,
      antalIntresse: status?.antalIntresseanmalningar ?? null,
    }
  })
}

export function buildPlayoffParticipants(
  lagenheter: Lagenhet[],
  intresseIndex: Record<string, IntresseStatus>,
  userPoang?: number | null,
  favorites: Lagenhet[] = [],
): PlayoffParticipant[] {
  const participants = buildVirtualUsers(lagenheter, intresseIndex).map(virtualUserToParticipant)

  if (userPoang == null || favorites.length === 0) {
    return participants
  }

  const favoritePlacements = buildFavoritePlacements(favorites, intresseIndex, userPoang)

  const existing = participants.find((participant) => participant.poang === userPoang)
  if (existing) {
    existing.placements = mergePlacements(existing.placements, favoritePlacements)
    existing.isCurrentUser = true
    return participants
  }

  participants.push({
    poang: userPoang,
    placements: favoritePlacements,
    isCurrentUser: true,
  })

  return participants
}

function buildApartmentLikers(
  participants: PlayoffParticipant[],
): Map<string, Set<number>> {
  const apartmentLikers = new Map<string, Set<number>>()

  for (const participant of participants) {
    for (const placement of participant.placements) {
      const likers = apartmentLikers.get(placement.objektNr) ?? new Set<number>()
      likers.add(participant.poang)
      apartmentLikers.set(placement.objektNr, likers)
    }
  }

  return apartmentLikers
}

export function calculateCompetition(
  objektNr: string,
  participantPoang: number,
  apartmentLikers: Map<string, Set<number>>,
): number {
  const likers = apartmentLikers.get(objektNr)
  if (!likers) return 0

  let count = 0
  for (const poang of likers) {
    if (poang !== participantPoang) {
      count += 1
    }
  }

  return count
}

function comparePlacements(
  left: VirtualUserPlacement,
  right: VirtualUserPlacement,
): number {
  const leftRank = left.rank ?? Number.POSITIVE_INFINITY
  const rightRank = right.rank ?? Number.POSITIVE_INFINITY
  if (leftRank !== rightRank) {
    return leftRank - rightRank
  }

  return left.objektNr.localeCompare(right.objektNr, 'sv-SE')
}

function pickBestPlacement(
  available: VirtualUserPlacement[],
  participantPoang: number,
  apartmentLikers: Map<string, Set<number>>,
): { chosen: VirtualUserPlacement; alternatives: PlayoffAlternative[]; pickReason: PlayoffPickReason } {
  const alternatives = available
    .map((placement) => ({
      placement,
      competition: calculateCompetition(placement.objektNr, participantPoang, apartmentLikers),
    }))
    .sort((left, right) => {
      if (left.competition !== right.competition) {
        return right.competition - left.competition
      }

      return comparePlacements(left.placement, right.placement)
    })

  const chosen = alternatives[0].placement
  const pickReason: PlayoffPickReason =
    alternatives.length === 1 ? 'only_choice' : 'highest_competition'

  return { chosen, alternatives, pickReason }
}

function sortParticipants(participants: PlayoffParticipant[]): PlayoffParticipant[] {
  return [...participants].sort((left, right) => {
    if (left.poang !== right.poang) {
      return right.poang - left.poang
    }

    return left.placements.length - right.placements.length
  })
}

export function runPlayoff(participants: PlayoffParticipant[]): PlayoffResult {
  const sortedParticipants = sortParticipants(participants)
  const apartmentLikers = buildApartmentLikers(sortedParticipants)
  const assignedApartments = new Set<string>()
  const assignments: PlayoffAssignment[] = []
  const unassignedParticipants: PlayoffParticipant[] = []

  for (const participant of sortedParticipants) {
    const available = participant.placements.filter(
      (placement) => !assignedApartments.has(placement.objektNr),
    )

    if (available.length === 0) {
      unassignedParticipants.push(participant)
      assignments.push({
        step: assignments.length + 1,
        participant,
        assigned: null,
        alternatives: [],
        pickReason: null,
      })
      continue
    }

    const { chosen, alternatives, pickReason } = pickBestPlacement(
      available,
      participant.poang,
      apartmentLikers,
    )

    assignedApartments.add(chosen.objektNr)
    assignments.push({
      step: assignments.length + 1,
      participant,
      assigned: chosen,
      alternatives,
      pickReason,
    })
  }

  const allPlacements = new Map<string, VirtualUserPlacement>()
  for (const participant of sortedParticipants) {
    for (const placement of participant.placements) {
      allPlacements.set(placement.objektNr, placement)
    }
  }

  const unassignedApartments = [...allPlacements.values()].filter(
    (placement) => !assignedApartments.has(placement.objektNr),
  )

  return {
    assignments,
    unassignedParticipants,
    unassignedApartments,
  }
}

export function computePlayoff(
  lagenheter: Lagenhet[],
  intresseIndex: Record<string, IntresseStatus>,
  userPoang?: number | null,
  favorites: Lagenhet[] = [],
): PlayoffResult {
  const participants = buildPlayoffParticipants(
    lagenheter,
    intresseIndex,
    userPoang,
    favorites,
  )

  return runPlayoff(participants)
}

function buildApartmentWinners(
  assignments: PlayoffAssignment[],
): Map<string, PlayoffAssignment> {
  const winners = new Map<string, PlayoffAssignment>()

  for (const assignment of assignments) {
    if (assignment.assigned) {
      winners.set(assignment.assigned.objektNr, assignment)
    }
  }

  return winners
}

export function getFavoriteApartmentOutcomes(
  result: PlayoffResult,
  favorites: Lagenhet[],
  intresseIndex: Record<string, IntresseStatus>,
  userPoang?: number | null,
): FavoriteApartmentOutcome[] {
  if (favorites.length === 0) {
    return []
  }

  const winners = buildApartmentWinners(result.assignments)
  const favoritePlacements =
    userPoang != null
      ? buildFavoritePlacements(favorites, intresseIndex, userPoang)
      : favorites.map((lagenhet) => {
          const status = intresseIndex[lagenhet.refid]
          return {
            objektNr: lagenhet.objektNr,
            adress: lagenhet.adress,
            omrade: lagenhet.omrade,
            rank: null,
            antalIntresse: status?.antalIntresseanmalningar ?? null,
          }
        })

  return favoritePlacements.map((placement) => {
    const winner = winners.get(placement.objektNr)

    if (!winner) {
      return {
        placement,
        winnerPoang: null,
        winnerStep: null,
        isCurrentUserWinner: false,
        status: 'unassigned',
      }
    }

    const isCurrentUserWinner = winner.participant.isCurrentUser === true

    return {
      placement,
      winnerPoang: winner.participant.poang,
      winnerStep: winner.step,
      isCurrentUserWinner,
      status: isCurrentUserWinner ? 'you' : 'other',
    }
  })
}
