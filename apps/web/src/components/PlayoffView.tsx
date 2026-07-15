import { Link } from '@tanstack/react-router'
import { ChevronDownIcon, ChevronRightIcon, LoaderCircleIcon, RefreshCwIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFavoriteLagenheter } from '#/hooks/useFavoriteLagenheter'
import { savePlayoffDetailReturn } from '#/lib/detail-return'
import { getIntresseStatus } from '#/lib/intresse'
import {
  loadStoredIntresseIndex,
  loadUserPoang,
  pickIntresseIndex,
  saveStoredIntresseIndex,
  saveUserPoang,
} from '#/lib/konkurrens-state'
import { computePlayoff, getFavoriteApartmentOutcomes } from '#/lib/playoff'
import type { FavoriteApartmentOutcome, PlayoffAssignment } from '#/types/playoff'
import type { VirtualUserPlacement } from '#/types/konkurrens'
import type { IntresseIndexFile } from '#/types/intresse'
import type { Lagenhet } from '#/types/lagenhet'

const numberFormatter = new Intl.NumberFormat('sv-SE')
const dateTimeFormatter = new Intl.DateTimeFormat('sv-SE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

type PlayoffViewProps = {
  lagenheter: Lagenhet[]
  initialIntresseIndex: IntresseIndexFile
}

export function PlayoffView({ lagenheter, initialIntresseIndex }: PlayoffViewProps) {
  const { favorites } = useFavoriteLagenheter()
  const [intresseIndex, setIntresseIndex] = useState(initialIntresseIndex)
  const [userPoangInput, setUserPoangInput] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshProgress, setRefreshProgress] = useState<{ current: number; total: number } | null>(
    null,
  )

  useEffect(() => {
    setIntresseIndex(pickIntresseIndex(initialIntresseIndex, loadStoredIntresseIndex()))
    setUserPoangInput(loadUserPoang())
  }, [initialIntresseIndex])

  const userPoang = useMemo(() => {
    const parsed = Number(userPoangInput.replace(/\s/g, '').replace(',', '.'))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [userPoangInput])

  const playoff = useMemo(
    () => computePlayoff(lagenheter, intresseIndex.data, userPoang, favorites),
    [lagenheter, intresseIndex.data, userPoang, favorites],
  )

  const assignedCount = playoff.assignments.filter((assignment) => assignment.assigned != null).length

  const favoriteOutcomes = useMemo(
    () => getFavoriteApartmentOutcomes(playoff, favorites, intresseIndex.data, userPoang),
    [playoff, favorites, intresseIndex.data, userPoang],
  )

  const currentUserAssignment = useMemo(
    () => playoff.assignments.find((assignment) => assignment.participant.isCurrentUser),
    [playoff.assignments],
  )

  const favoriteObjektNrs = useMemo(
    () => new Set(favorites.map((favorite) => favorite.objektNr)),
    [favorites],
  )

  const handleUserPoangChange = (value: string) => {
    setUserPoangInput(value)
    saveUserPoang(value)
  }

  const saveReturnToPlayoff = () => {
    savePlayoffDetailReturn()
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshProgress({ current: 0, total: lagenheter.length })

    const data: IntresseIndexFile['data'] = {}
    let completed = 0
    let nextIndex = 0

    async function worker() {
      while (nextIndex < lagenheter.length) {
        const index = nextIndex
        nextIndex += 1
        const lagenhet = lagenheter[index]

        try {
          const status = await getIntresseStatus({ data: lagenhet.refid })
          if (status) {
            data[lagenhet.refid] = status
          }
        } catch {
          // Skip failed refids
        }

        completed += 1
        setRefreshProgress({ current: completed, total: lagenheter.length })
      }
    }

    try {
      await Promise.all(Array.from({ length: 3 }, () => worker()))
      const nextIndexFile: IntresseIndexFile = {
        fetchedAt: new Date().toISOString(),
        data,
      }
      setIntresseIndex(nextIndexFile)
      saveStoredIntresseIndex(nextIndexFile)
    } finally {
      setRefreshing(false)
      setRefreshProgress(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Playoff</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Simulerad fördelning av lägenheter. Deltagare sorteras efter köpoäng (högst först). Varje
          person får sin bästa tillgängliga sparade/intresseanmälda lägenhet. Om flera val finns
          väljs den med högst konkurrens — flest andra personer med höga köpoäng som också gillar
          den.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Senast uppdaterad
          </p>
          <p className="text-sm font-medium">
            {dateTimeFormatter.format(new Date(intresseIndex.fetchedAt))}
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="playoff-user-poang"
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            Dina köpoäng
          </label>
          <Input
            id="playoff-user-poang"
            inputMode="numeric"
            placeholder="t.ex. 150"
            value={userPoangInput}
            onChange={(event) => handleUserPoangChange(event.target.value)}
            className="w-40"
          />
        </div>

        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <LoaderCircleIcon className="animate-spin" /> : <RefreshCwIcon />}
          Uppdatera live
        </Button>

        {refreshProgress && (
          <p className="text-sm text-muted-foreground">
            {refreshProgress.current} / {refreshProgress.total} lägenheter…
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Tilldelade" value={assignedCount} />
        <SummaryCard label="Utan lägenhet" value={playoff.unassignedParticipants.length} />
        <SummaryCard label="Lediga lägenheter" value={playoff.unassignedApartments.length} />
      </div>

      {favoriteOutcomes.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Dina sparade lägenheter — vem fick dem?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentUserAssignment?.assigned ? (
                <>
                  Du tilldelades{' '}
                  <span className="font-medium text-foreground">
                    {currentUserAssignment.assigned.adress}
                  </span>
                  {favoriteOutcomes.some(
                    (outcome) =>
                      outcome.placement.objektNr === currentUserAssignment.assigned?.objektNr,
                  )
                    ? ' — en av dina sparade.'
                    : ' — inte en av dina sparade.'}{' '}
                  Nedan ser du vem som fick varje sparad lägenhet.
                </>
              ) : userPoang != null ? (
                'Du fick ingen lägenhet i simuleringen. Nedan ser du vem som fick dina sparade val.'
              ) : (
                'Ange dina köpoäng för att se var du hamnar. Nedan ser du vem som fick dina sparade lägenheter.'
              )}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium">Lägenhet</th>
                  <th className="px-4 py-3 font-medium">Din plats</th>
                  <th className="px-4 py-3 font-medium">Vinnare</th>
                  <th className="px-4 py-3 font-medium">Steg</th>
                </tr>
              </thead>
              <tbody>
                {favoriteOutcomes.map((outcome) => (
                  <FavoriteOutcomeRow
                    key={outcome.placement.objektNr}
                    outcome={outcome}
                    onNavigateToDetail={saveReturnToPlayoff}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {playoff.assignments.length === 0 ? (
        <p className="rounded-xl border p-4 text-sm text-muted-foreground">
          Ingen intressedata ännu. Kör scrapern med{' '}
          <code className="rounded bg-muted px-1 py-0.5">pnpm scraper:save</code> eller klicka
          &quot;Uppdatera live&quot;.
        </p>
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Fördelning</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Steg-för-steg i ordning efter köpoäng. Expandera rader med flera alternativ för att se
              konkurrens per lägenhet.
              {favoriteObjektNrs.size > 0 && (
                <> Rader markerade i färg visar när någon tilldelades en av dina sparade lägenheter.</>
              )}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium">Steg</th>
                  <th className="px-4 py-3 font-medium">Köpoäng</th>
                  <th className="px-4 py-3 font-medium">Tilldelad lägenhet</th>
                  <th className="px-4 py-3 font-medium">Val</th>
                </tr>
              </thead>
              <tbody>
                {playoff.assignments.map((assignment) => (
                  <PlayoffAssignmentRow
                    key={`${assignment.step}-${assignment.participant.poang}`}
                    assignment={assignment}
                    isAssignedFavorite={
                      assignment.assigned != null &&
                      favoriteObjektNrs.has(assignment.assigned.objektNr)
                    }
                    onNavigateToDetail={saveReturnToPlayoff}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {playoff.unassignedApartments.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Lägenheter utan vinnare</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lägenheter som hade intresse men inte tilldelades i simuleringen.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {playoff.unassignedApartments.map((placement) => (
              <PlacementLink
                key={placement.objektNr}
                placement={placement}
                onNavigateToDetail={saveReturnToPlayoff}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

type SummaryCardProps = {
  label: string
  value: number
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{numberFormatter.format(value)}</p>
    </div>
  )
}

type FavoriteOutcomeRowProps = {
  outcome: FavoriteApartmentOutcome
  onNavigateToDetail: () => void
}

function FavoriteOutcomeRow({ outcome, onNavigateToDetail }: FavoriteOutcomeRowProps) {
  return (
    <tr
      className={`border-b ${outcome.status === 'you' ? 'bg-primary/5' : ''}`}
    >
      <td className="px-4 py-3">
        <Link
          to="/lagenhet/$objektNr"
          params={{ objektNr: outcome.placement.objektNr }}
          onClick={onNavigateToDetail}
          className="font-medium hover:underline"
        >
          {outcome.placement.adress}
        </Link>
        <p className="text-xs text-muted-foreground">{outcome.placement.omrade}</p>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {outcome.placement.rank != null ? `#${outcome.placement.rank}` : '—'}
      </td>
      <td className="px-4 py-3">
        {outcome.status === 'unassigned' ? (
          <span className="text-muted-foreground">Ingen (ledig)</span>
        ) : outcome.status === 'you' ? (
          <span className="font-medium">
            Du
            <span className="ml-1 text-muted-foreground">
              ({numberFormatter.format(outcome.winnerPoang ?? 0)} p)
            </span>
          </span>
        ) : (
          <span className="font-medium">
            {numberFormatter.format(outcome.winnerPoang ?? 0)} p
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {outcome.winnerStep ?? '—'}
      </td>
    </tr>
  )
}

type PlayoffAssignmentRowProps = {
  assignment: PlayoffAssignment
  isAssignedFavorite: boolean
  onNavigateToDetail: () => void
}

function PlayoffAssignmentRow({
  assignment,
  isAssignedFavorite,
  onNavigateToDetail,
}: PlayoffAssignmentRowProps) {
  const [expanded, setExpanded] = useState(false)
  const hasAlternatives = assignment.alternatives.length > 1
  const isCurrentUser = assignment.participant.isCurrentUser === true

  return (
    <>
      <tr
        className={`border-b ${
          isCurrentUser || isAssignedFavorite ? 'bg-primary/5' : ''
        }`}
      >
        <td className="px-4 py-3 text-muted-foreground">{assignment.step}</td>
        <td className="px-4 py-3 font-medium">
          {numberFormatter.format(assignment.participant.poang)} p
          {isCurrentUser && (
            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              Du
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          {assignment.assigned ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/lagenhet/$objektNr"
                params={{ objektNr: assignment.assigned.objektNr }}
                onClick={onNavigateToDetail}
                className="font-medium hover:underline"
              >
                {assignment.assigned.adress}
              </Link>
              {isAssignedFavorite && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                  Din sparade
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">Ingen tillgänglig</span>
          )}
          {assignment.assigned && (
            <p className="text-xs text-muted-foreground">{assignment.assigned.omrade}</p>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{formatPickReason(assignment)}</span>
            {hasAlternatives && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? (
                  <>
                    <ChevronDownIcon className="size-3" />
                    Dölj alternativ
                  </>
                ) : (
                  <>
                    <ChevronRightIcon className="size-3" />
                    {assignment.alternatives.length} alternativ
                  </>
                )}
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && hasAlternatives && (
        <tr
          className={`border-b ${
            isCurrentUser || isAssignedFavorite ? 'bg-primary/5' : 'bg-muted/20'
          }`}
        >
          <td colSpan={4} className="px-4 py-3">
            <div className="space-y-2">
              {assignment.alternatives.map((alternative) => (
                <div
                  key={alternative.placement.objektNr}
                  className="flex flex-wrap items-center gap-2 text-xs"
                >
                  <PlacementLink
                    placement={alternative.placement}
                    onNavigateToDetail={onNavigateToDetail}
                  />
                  <span className="text-muted-foreground">
                    {alternative.competition} konkurrent
                    {alternative.competition === 1 ? '' : 'er'}
                  </span>
                  {assignment.assigned?.objektNr === alternative.placement.objektNr && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">Vald</span>
                  )}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function formatPickReason(assignment: PlayoffAssignment): string {
  if (!assignment.assigned) {
    return 'Alla val redan tagna'
  }

  if (assignment.pickReason === 'only_choice') {
    return 'Enda valet'
  }

  if (assignment.pickReason === 'highest_competition') {
    const competition =
      assignment.alternatives.find(
        (alternative) => alternative.placement.objektNr === assignment.assigned?.objektNr,
      )?.competition ?? 0
    return `Högst konkurrens (${competition})`
  }

  return '—'
}

type PlacementLinkProps = {
  placement: VirtualUserPlacement
  onNavigateToDetail: () => void
}

function PlacementLink({ placement, onNavigateToDetail }: PlacementLinkProps) {
  return (
    <Link
      to="/lagenhet/$objektNr"
      params={{ objektNr: placement.objektNr }}
      onClick={onNavigateToDetail}
      className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs transition-colors hover:bg-muted"
    >
      <span>{placement.adress}</span>
      {placement.rank != null && (
        <span className="rounded bg-muted px-1 text-muted-foreground">#{placement.rank}</span>
      )}
    </Link>
  )
}
