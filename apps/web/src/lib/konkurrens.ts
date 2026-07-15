import type {
  KonkurrensResult,
  LagenhetKonkurrens,
  TopCompetitor,
  VirtualUser,
} from '#/types/konkurrens'
import type { IntresseStatus } from '#/types/intresse'
import type { Lagenhet } from '#/types/lagenhet'

/** 0 p is Studentbostäder's placeholder when nobody has registered interest. */
export function isPlaceholderPoang(poang: number): boolean {
  return poang === 0
}

export function filterRealPoang(poang: number[]): number[] {
  return poang.filter((value) => !isPlaceholderPoang(value))
}

export function hasRealIntresse(topPoang: number[]): boolean {
  return filterRealPoang(topPoang).length > 0
}

function rankWeight(rank: number): number {
  return 1 - (rank - 1) * 0.2
}

export function roundBookabilityScore(score: number): number {
  return Math.round(score * 10) / 10
}

export function formatBookabilityScoreValue(score: number): string {
  const rounded = roundBookabilityScore(score)
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function calculateBookabilityScore(
  competitors: TopCompetitor[],
  userPoang?: number | null,
): number {
  if (competitors.length === 0) {
    return userPoang != null ? 10 : 8
  }

  let score = 0

  for (const competitor of competitors) {
    const weight = rankWeight(competitor.rank)

    if (competitor.spreadCount >= 2) {
      score += 3 * weight
      if (competitor.spreadCount >= 3) {
        score += 1 * weight
      }
    } else {
      score -= 2 * weight
    }
  }

  if (userPoang != null && competitors.length > 0) {
    const maxPoang = Math.max(...competitors.map((competitor) => competitor.poang))
    const topPoang = competitors[0]?.poang

    if (userPoang > maxPoang) {
      score += 5
    } else if (topPoang != null && userPoang < topPoang) {
      score -= 3
    }
  }

  return roundBookabilityScore(score)
}

export function getBookabilitySummaryLines(
  item: LagenhetKonkurrens,
  userPoang?: number | null,
): string[] {
  if (item.topCompetitors.length === 0) {
    const hasPlaceholderOnly =
      item.intresseStatus != null && !hasRealIntresse(item.intresseStatus.topPoang)

    if (hasPlaceholderOnly) {
      return [
        'Ingen har anmält intresse ännu.',
        '0 p är systemets standard — räknas inte som en riktig person.',
      ]
    }

    return ['Baserat på vem i topp 5 som verkar dedikerad vs spridd över flera lägenheter.']
  }

  const lines = [
    '0 p ignoreras — det är systemets standard när ingen anmält intresse.',
    'Spridda konkurrenter (+): anmält intresse på flera lägenheter, troligen inte fast vid denna.',
    'Dedikerade konkurrenter (−): syns bara här, mer sannolikt att de tar denna.',
    'Poäng viktas efter placering i topp 5 (etta väger tyngst).',
  ]

  if (item.spreadCount > 0) {
    lines.push(`${item.spreadCount} spridd${item.spreadCount === 1 ? '' : 'a'} i topp 5.`)
  }
  if (item.dedicatedCount > 0) {
    lines.push(`${item.dedicatedCount} dedikerad${item.dedicatedCount === 1 ? '' : 'e'} i topp 5.`)
  }

  if (userPoang != null && item.userBeatsAll) {
    lines.push('Dina köpoäng slår alla i topp 5 (+5).')
  } else if (userPoang != null && item.topCompetitors[0] && userPoang < item.topCompetitors[0].poang) {
    lines.push('Dina köpoäng är lägre än ledaren (−3).')
  }

  return lines
}

export function calculateUserWouldRank(
  userPoang: number,
  topPoang: number[],
): number | null {
  const realTopPoang = filterRealPoang(topPoang)
  if (realTopPoang.length === 0) return 1
  return realTopPoang.filter((poang) => poang > userPoang).length + 1
}

export function userBeatsAllCompetitors(
  userPoang: number | null | undefined,
  topPoang: number[],
): boolean {
  if (userPoang == null) return false

  const realTopPoang = filterRealPoang(topPoang)
  if (realTopPoang.length === 0) return true
  return userPoang > Math.max(...realTopPoang)
}

export function buildVirtualUsers(
  lagenheter: Lagenhet[],
  intresseIndex: Record<string, IntresseStatus>,
): VirtualUser[] {
  const virtualUsersMap = new Map<number, VirtualUser>()

  for (const lagenhet of lagenheter) {
    const status = intresseIndex[lagenhet.refid]
    if (!status) continue

    status.topPoang.forEach((poang, index) => {
      if (isPlaceholderPoang(poang)) return

      const rank = filterRealPoang(status.topPoang.slice(0, index + 1)).length
      let user = virtualUsersMap.get(poang)
      if (!user) {
        user = { poang, placements: [] }
        virtualUsersMap.set(poang, user)
      }

      user.placements.push({
        objektNr: lagenhet.objektNr,
        adress: lagenhet.adress,
        omrade: lagenhet.omrade,
        rank,
        antalIntresse: status.antalIntresseanmalningar,
      })
    })
  }

  return [...virtualUsersMap.values()].sort(
    (left, right) =>
      right.placements.length - left.placements.length || right.poang - left.poang,
  )
}

export function aggregateKonkurrens(
  lagenheter: Lagenhet[],
  intresseIndex: Record<string, IntresseStatus>,
  userPoang?: number | null,
): KonkurrensResult {
  const virtualUsers = buildVirtualUsers(lagenheter, intresseIndex)
  const spreadCounts = new Map<number, number>(
    virtualUsers.map((user) => [user.poang, user.placements.length]),
  )

  const lagenhetKonkurrens: LagenhetKonkurrens[] = lagenheter.map((lagenhet) => {
    const intresseStatus = intresseIndex[lagenhet.refid] ?? null
    const topPoang = intresseStatus?.topPoang ?? []
    const realTopPoang = filterRealPoang(topPoang)

    const topCompetitors: TopCompetitor[] = realTopPoang.map((poang, index) => ({
      poang,
      rank: index + 1,
      spreadCount: spreadCounts.get(poang) ?? 1,
    }))

    const spreadCount = topCompetitors.filter((competitor) => competitor.spreadCount >= 2).length
    const dedicatedCount = topCompetitors.filter(
      (competitor) => competitor.spreadCount === 1,
    ).length

    return {
      lagenhet,
      intresseStatus,
      topCompetitors,
      bookabilityScore: calculateBookabilityScore(topCompetitors, userPoang),
      spreadCount,
      dedicatedCount,
      userWouldRank:
        userPoang != null ? calculateUserWouldRank(userPoang, topPoang) : null,
      userBeatsAll: userBeatsAllCompetitors(userPoang, topPoang),
    }
  })

  return { virtualUsers, lagenhetKonkurrens }
}

export function getLagenhetKonkurrensByObjektNr(
  result: KonkurrensResult,
  objektNr: string,
): LagenhetKonkurrens | undefined {
  return result.lagenhetKonkurrens.find((item) => item.lagenhet.objektNr === objektNr)
}
