import { describe, expect, it } from 'vitest'

import {
  aggregateKonkurrens,
  calculateBookabilityScore,
  userBeatsAllCompetitors,
} from '#/lib/konkurrens'
import type { Lagenhet } from '#/types/lagenhet'

function makeLagenhet(overrides: Partial<Lagenhet> & Pick<Lagenhet, 'objektNr' | 'refid' | 'adress'>): Lagenhet {
  return {
    tinyObjektNr: overrides.objektNr,
    omrade: 'Campus',
    omradeKod: 'C',
    hyra: 5000,
    hyraEnhet: 'kr/mån',
    typ: '1 rok',
    typOvergripande: '1 rok',
    yta: 30,
    vaning: '1',
    antalVaningar: 3,
    inflyttningDatum: '2026-08-01',
    inflyttningTidigareDatum: null,
    detaljUrl: 'https://example.com',
    hiss: true,
    beskrivning: '',
    poang: 100,
    egenskaper: [],
    bildUrl: 'https://example.com/image.jpg',
    bilder: [],
    publiceratDatum: '2026-07-01',
    harIntresseanmaltsAvInloggadKund: false,
    planlosningUrl: null,
    ...overrides,
  }
}

describe('aggregateKonkurrens', () => {
  it('groups equal poang into one virtual user with spread count', () => {
    const lagenheter = [
      makeLagenhet({ objektNr: '1', refid: 'ref-1', adress: 'Gatan 1' }),
      makeLagenhet({ objektNr: '2', refid: 'ref-2', adress: 'Gatan 2' }),
      makeLagenhet({ objektNr: '3', refid: 'ref-3', adress: 'Gatan 3' }),
    ]

    const intresseIndex = {
      'ref-1': { antalIntresseanmalningar: 10, topPoang: [200, 150] },
      'ref-2': { antalIntresseanmalningar: 8, topPoang: [200, 120] },
      'ref-3': { antalIntresseanmalningar: 5, topPoang: [200] },
    }

    const result = aggregateKonkurrens(lagenheter, intresseIndex)

    expect(result.virtualUsers).toHaveLength(3)
    const spreadUser = result.virtualUsers.find((user) => user.poang === 200)
    expect(spreadUser?.placements).toHaveLength(3)
  })

  it('scores spread rank-1 competitors higher than dedicated rank-1 competitors', () => {
    const spreadLagenhet = makeLagenhet({
      objektNr: 'spread',
      refid: 'ref-spread',
      adress: 'Spridd 1',
    })
    const dedicatedLagenhet = makeLagenhet({
      objektNr: 'dedicated',
      refid: 'ref-dedicated',
      adress: 'Dedikerad 1',
    })
    const filler = [
      makeLagenhet({ objektNr: '2', refid: 'ref-2', adress: 'Gatan 2' }),
      makeLagenhet({ objektNr: '3', refid: 'ref-3', adress: 'Gatan 3' }),
      makeLagenhet({ objektNr: '4', refid: 'ref-4', adress: 'Gatan 4' }),
    ]

    const intresseIndex = {
      'ref-spread': { antalIntresseanmalningar: 12, topPoang: [300] },
      'ref-dedicated': { antalIntresseanmalningar: 4, topPoang: [250] },
      'ref-2': { antalIntresseanmalningar: 6, topPoang: [300] },
      'ref-3': { antalIntresseanmalningar: 6, topPoang: [300] },
      'ref-4': { antalIntresseanmalningar: 6, topPoang: [300] },
    }

    const result = aggregateKonkurrens(
      [spreadLagenhet, dedicatedLagenhet, ...filler],
      intresseIndex,
    )

    const spreadScore = result.lagenhetKonkurrens.find(
      (item) => item.lagenhet.objektNr === 'spread',
    )?.bookabilityScore
    const dedicatedScore = result.lagenhetKonkurrens.find(
      (item) => item.lagenhet.objektNr === 'dedicated',
    )?.bookabilityScore

    expect(spreadScore).toBeGreaterThan(dedicatedScore ?? 0)
  })

  it('deduplicates repeated topPoang for the same lägenhet when building virtual users', () => {
    const lagenhet = makeLagenhet({
      objektNr: '92B0200C016',
      refid: 'ref-1',
      adress: 'Gatan 1',
    })
    const intresseIndex = {
      'ref-1': { antalIntresseanmalningar: 10, topPoang: [153, 144, 144, 144, 132] },
    }

    const result = aggregateKonkurrens([lagenhet], intresseIndex)
    const user144 = result.virtualUsers.find((user) => user.poang === 144)

    expect(user144?.placements).toHaveLength(1)
    expect(user144?.placements[0]?.objektNr).toBe('92B0200C016')
    expect(user144?.placements[0]?.rank).toBe(2)
    expect(result.lagenhetKonkurrens[0]?.topCompetitors).toHaveLength(3)
  })

  it('marks user poang above all top 5 as beating all competitors', () => {
    const lagenhet = makeLagenhet({ objektNr: '1', refid: 'ref-1', adress: 'Gatan 1' })
    const intresseIndex = {
      'ref-1': { antalIntresseanmalningar: 5, topPoang: [100, 90, 80] },
    }

    const result = aggregateKonkurrens([lagenhet], intresseIndex, 150)
    const item = result.lagenhetKonkurrens[0]

    expect(item.userBeatsAll).toBe(true)
    expect(item.userWouldRank).toBe(1)
  })

  it('ignores 0 p placeholders and treats empty competition as highly bookable', () => {
    const lagenhet = makeLagenhet({ objektNr: '1', refid: 'ref-1', adress: 'Gatan 1' })
    const intresseIndex = {
      'ref-1': { antalIntresseanmalningar: 0, topPoang: [0, 0, 0] },
      'ref-2': { antalIntresseanmalningar: 2, topPoang: [0, 150] },
    }
    const other = makeLagenhet({ objektNr: '2', refid: 'ref-2', adress: 'Gatan 2' })

    const result = aggregateKonkurrens([lagenhet, other], intresseIndex, 100)

    expect(result.virtualUsers).toHaveLength(1)
    expect(result.virtualUsers[0]?.poang).toBe(150)

    const emptyItem = result.lagenhetKonkurrens.find(
      (item) => item.lagenhet.objektNr === '1',
    )
    expect(emptyItem?.topCompetitors).toHaveLength(0)
    expect(emptyItem?.bookabilityScore).toBeGreaterThanOrEqual(8)
    expect(emptyItem?.userBeatsAll).toBe(true)
  })
})

describe('calculateBookabilityScore', () => {
  it('rewards spread competitors and penalizes dedicated ones', () => {
    const spreadScore = calculateBookabilityScore([
      { poang: 200, rank: 1, spreadCount: 4 },
    ])
    const dedicatedScore = calculateBookabilityScore([
      { poang: 200, rank: 1, spreadCount: 1 },
    ])

    expect(spreadScore).toBeGreaterThan(dedicatedScore)
  })

  it('rounds away floating point noise', () => {
    const score = calculateBookabilityScore([
      { poang: 200, rank: 2, spreadCount: 2 },
      { poang: 180, rank: 3, spreadCount: 1 },
    ])

    expect(score).toBe(Math.round(score * 10) / 10)
    expect(String(score)).not.toMatch(/\.\d{4,}/)
  })
})

describe('userBeatsAllCompetitors', () => {
  it('returns true only when user poang exceeds every top score', () => {
    expect(userBeatsAllCompetitors(150, [100, 90])).toBe(true)
    expect(userBeatsAllCompetitors(100, [100, 90])).toBe(false)
    expect(userBeatsAllCompetitors(null, [100])).toBe(false)
  })

  it('returns true when only placeholder 0 p scores exist', () => {
    expect(userBeatsAllCompetitors(50, [0, 0, 0])).toBe(true)
  })
})
