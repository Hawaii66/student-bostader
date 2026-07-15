import { describe, expect, it } from 'vitest'

import {
  buildPlayoffParticipants,
  computePlayoff,
  getFavoriteApartmentOutcomes,
  runPlayoff,
} from '#/lib/playoff'
import type { PlayoffParticipant } from '#/types/playoff'
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

describe('runPlayoff', () => {
  it('assigns highest köpoäng first', () => {
    const participants: PlayoffParticipant[] = [
      {
        poang: 150,
        placements: [
          {
            objektNr: '2',
            adress: 'Gatan 2',
            omrade: 'Campus',
            rank: 1,
            antalIntresse: 5,
          },
        ],
      },
      {
        poang: 300,
        placements: [
          {
            objektNr: '1',
            adress: 'Gatan 1',
            omrade: 'Campus',
            rank: 1,
            antalIntresse: 5,
          },
        ],
      },
    ]

    const result = runPlayoff(participants)

    expect(result.assignments[0]?.participant.poang).toBe(300)
    expect(result.assignments[0]?.assigned?.objektNr).toBe('1')
    expect(result.assignments[1]?.participant.poang).toBe(150)
    expect(result.assignments[1]?.assigned?.objektNr).toBe('2')
  })

  it('picks apartment with highest competition when multiple likes exist', () => {
    const participants: PlayoffParticipant[] = [
      {
        poang: 300,
        placements: [
          {
            objektNr: '1',
            adress: 'Gatan 1',
            omrade: 'Campus',
            rank: 1,
            antalIntresse: 10,
          },
          {
            objektNr: '2',
            adress: 'Gatan 2',
            omrade: 'Campus',
            rank: 1,
            antalIntresse: 8,
          },
        ],
      },
      {
        poang: 250,
        placements: [
          {
            objektNr: '1',
            adress: 'Gatan 1',
            omrade: 'Campus',
            rank: 2,
            antalIntresse: 10,
          },
        ],
      },
      {
        poang: 200,
        placements: [
          {
            objektNr: '1',
            adress: 'Gatan 1',
            omrade: 'Campus',
            rank: 3,
            antalIntresse: 10,
          },
          {
            objektNr: '2',
            adress: 'Gatan 2',
            omrade: 'Campus',
            rank: 2,
            antalIntresse: 8,
          },
        ],
      },
    ]

    const result = runPlayoff(participants)
    const topAssignment = result.assignments.find(
      (assignment) => assignment.participant.poang === 300,
    )

    expect(topAssignment?.assigned?.objektNr).toBe('1')
    expect(topAssignment?.pickReason).toBe('highest_competition')
    expect(topAssignment?.alternatives.find((item) => item.placement.objektNr === '1')?.competition).toBe(2)
    expect(topAssignment?.alternatives.find((item) => item.placement.objektNr === '2')?.competition).toBe(1)
  })

  it('skips already assigned apartments for later users', () => {
    const participants: PlayoffParticipant[] = [
      {
        poang: 300,
        placements: [
          {
            objektNr: '1',
            adress: 'Gatan 1',
            omrade: 'Campus',
            rank: 1,
            antalIntresse: 5,
          },
        ],
      },
      {
        poang: 200,
        placements: [
          {
            objektNr: '1',
            adress: 'Gatan 1',
            omrade: 'Campus',
            rank: 2,
            antalIntresse: 5,
          },
          {
            objektNr: '2',
            adress: 'Gatan 2',
            omrade: 'Campus',
            rank: 1,
            antalIntresse: 4,
          },
        ],
      },
    ]

    const result = runPlayoff(participants)
    const secondAssignment = result.assignments.find(
      (assignment) => assignment.participant.poang === 200,
    )

    expect(secondAssignment?.assigned?.objektNr).toBe('2')
  })

  it('breaks competition ties by rank and then objektNr', () => {
    const participants: PlayoffParticipant[] = [
      {
        poang: 300,
        placements: [
          {
            objektNr: 'b',
            adress: 'Gatan B',
            omrade: 'Campus',
            rank: 2,
            antalIntresse: 5,
          },
          {
            objektNr: 'a',
            adress: 'Gatan A',
            omrade: 'Campus',
            rank: 1,
            antalIntresse: 5,
          },
        ],
      },
      {
        poang: 250,
        placements: [
          {
            objektNr: 'b',
            adress: 'Gatan B',
            omrade: 'Campus',
            rank: 1,
            antalIntresse: 5,
          },
          {
            objektNr: 'a',
            adress: 'Gatan A',
            omrade: 'Campus',
            rank: 2,
            antalIntresse: 5,
          },
        ],
      },
    ]

    const result = runPlayoff(participants)
    const topAssignment = result.assignments.find(
      (assignment) => assignment.participant.poang === 300,
    )

    expect(topAssignment?.assigned?.objektNr).toBe('a')
  })
})

describe('buildPlayoffParticipants', () => {
  it('merges current user with matching virtual user and unions favorites', () => {
    const lagenheter = [
      makeLagenhet({ objektNr: '1', refid: 'ref-1', adress: 'Gatan 1' }),
      makeLagenhet({ objektNr: '2', refid: 'ref-2', adress: 'Gatan 2' }),
      makeLagenhet({ objektNr: '3', refid: 'ref-3', adress: 'Gatan 3' }),
    ]

    const intresseIndex = {
      'ref-1': { antalIntresseanmalningar: 10, topPoang: [200, 150] },
      'ref-2': { antalIntresseanmalningar: 8, topPoang: [200, 120] },
      'ref-3': { antalIntresseanmalningar: 5, topPoang: [180] },
    }

    const participants = buildPlayoffParticipants(lagenheter, intresseIndex, 200, [
      makeLagenhet({ objektNr: '3', refid: 'ref-3', adress: 'Gatan 3' }),
    ])

    expect(participants.filter((participant) => participant.poang === 200)).toHaveLength(1)
    const currentUser = participants.find((participant) => participant.isCurrentUser)
    expect(currentUser?.placements.map((placement) => placement.objektNr).sort()).toEqual([
      '1',
      '2',
      '3',
    ])
  })
})

describe('computePlayoff', () => {
  it('marks users without available likes as unassigned', () => {
    const lagenheter = [
      makeLagenhet({ objektNr: '1', refid: 'ref-1', adress: 'Gatan 1' }),
    ]

    const intresseIndex = {
      'ref-1': { antalIntresseanmalningar: 5, topPoang: [300, 200] },
    }

    const result = computePlayoff(lagenheter, intresseIndex)

    expect(result.unassignedParticipants).toHaveLength(1)
    expect(result.unassignedParticipants[0]?.poang).toBe(200)
    expect(result.unassignedApartments).toHaveLength(0)
  })
})

describe('getFavoriteApartmentOutcomes', () => {
  it('shows who won each favorite apartment', () => {
    const lagenheter = [
      makeLagenhet({ objektNr: '1', refid: 'ref-1', adress: 'Gatan 1' }),
      makeLagenhet({ objektNr: '2', refid: 'ref-2', adress: 'Gatan 2' }),
    ]

    const intresseIndex = {
      'ref-1': { antalIntresseanmalningar: 10, topPoang: [300, 200] },
      'ref-2': { antalIntresseanmalningar: 8, topPoang: [300, 150] },
    }

    const favorites = [lagenheter[0], lagenheter[1]]
    const result = computePlayoff(lagenheter, intresseIndex, 200, favorites)
    const outcomes = getFavoriteApartmentOutcomes(result, favorites, intresseIndex, 200)

    expect(outcomes).toHaveLength(2)

    const apt1 = outcomes.find((outcome) => outcome.placement.objektNr === '1')
    expect(apt1?.status).toBe('you')
    expect(apt1?.winnerPoang).toBe(200)
    expect(apt1?.winnerStep).toBe(2)

    const apt2 = outcomes.find((outcome) => outcome.placement.objektNr === '2')
    expect(apt2?.status).toBe('other')
    expect(apt2?.winnerPoang).toBe(300)
    expect(apt2?.winnerStep).toBe(1)
  })

  it('marks unassigned favorites as ledig', () => {
    const lagenheter = [
      makeLagenhet({ objektNr: '1', refid: 'ref-1', adress: 'Gatan 1' }),
      makeLagenhet({ objektNr: '2', refid: 'ref-2', adress: 'Gatan 2' }),
    ]

    const intresseIndex = {
      'ref-1': { antalIntresseanmalningar: 5, topPoang: [300] },
    }

    const favorites = [lagenheter[1]]
    const result = computePlayoff(lagenheter, intresseIndex)
    const outcomes = getFavoriteApartmentOutcomes(result, favorites, intresseIndex)

    expect(outcomes).toHaveLength(1)
    expect(outcomes[0]?.status).toBe('unassigned')
    expect(outcomes[0]?.winnerPoang).toBeNull()
  })
})
