import { Link } from '@tanstack/react-router'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { BookabilityCell } from '#/components/BookabilityCell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFavoriteLagenheter } from '#/hooks/useFavoriteLagenheter'
import {
  aggregateKonkurrens,
  getLagenhetKonkurrensByObjektNr,
} from '#/lib/konkurrens'
import {
  konkurrensSearchToState,
  loadStoredIntresseIndex,
  loadUserPoang,
  pickIntresseIndex,
  saveStoredIntresseIndex,
  saveUserPoang,
  stateToKonkurrensSearch,
  type KonkurrensSearch,
  type VirtualUserSort,
  type VirtualUserSortField,
} from '#/lib/konkurrens-state'
import { saveKonkurrensDetailReturn } from '#/lib/detail-return'
import { getIntresseStatus } from '#/lib/intresse'
import type { LagenhetKonkurrens, VirtualUser } from '#/types/konkurrens'
import type { IntresseIndexFile } from '#/types/intresse'
import type { Lagenhet } from '#/types/lagenhet'

const numberFormatter = new Intl.NumberFormat('sv-SE')
const dateTimeFormatter = new Intl.DateTimeFormat('sv-SE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

type KonkurrensViewProps = {
  lagenheter: Lagenhet[]
  initialIntresseIndex: IntresseIndexFile
  search: KonkurrensSearch
  onSearchChange: (search: KonkurrensSearch) => void
}

export function KonkurrensView({
  lagenheter,
  initialIntresseIndex,
  search,
  onSearchChange,
}: KonkurrensViewProps) {
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

  const { virtualUserSort, showAllLagenheter } = useMemo(
    () => konkurrensSearchToState(search),
    [search],
  )

  const saveReturnToKonkurrens = () => {
    saveKonkurrensDetailReturn(search)
  }

  const userPoang = useMemo(() => {
    const parsed = Number(userPoangInput.replace(/\s/g, '').replace(',', '.'))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [userPoangInput])

  const konkurrens = useMemo(
    () => aggregateKonkurrens(lagenheter, intresseIndex.data, userPoang),
    [lagenheter, intresseIndex.data, userPoang],
  )

  const sortedVirtualUsers = useMemo(() => {
    const users = [...konkurrens.virtualUsers]
    const direction = virtualUserSort.direction === 'asc' ? 1 : -1

    return users.sort((left, right) => {
      if (virtualUserSort.field === 'poang') {
        const diff = left.poang - right.poang
        return diff !== 0 ? diff * direction : right.placements.length - left.placements.length
      }

      const diff = left.placements.length - right.placements.length
      return diff !== 0 ? diff * direction : right.poang - left.poang
    })
  }, [konkurrens.virtualUsers, virtualUserSort])

  const toggleVirtualUserSort = (field: VirtualUserSortField) => {
    const nextSort: VirtualUserSort =
      virtualUserSort.field === field
        ? { field, direction: virtualUserSort.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: field === 'placements' ? 'desc' : 'asc' }

    onSearchChange(stateToKonkurrensSearch(nextSort, showAllLagenheter))
  }

  const toggleShowAllLagenheter = () => {
    onSearchChange(stateToKonkurrensSearch(virtualUserSort, !showAllLagenheter))
  }

  const favoriteKonkurrens = useMemo(() => {
    const items = favorites
      .map((favorite) => getLagenhetKonkurrensByObjektNr(konkurrens, favorite.objektNr))
      .filter((item): item is LagenhetKonkurrens => item != null)

    return [...items].sort((left, right) => right.bookabilityScore - left.bookabilityScore)
  }, [favorites, konkurrens])

  const handleUserPoangChange = (value: string) => {
    setUserPoangInput(value)
    saveUserPoang(value)
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

  const sortedAllLagenheter = useMemo(
    () =>
      [...konkurrens.lagenhetKonkurrens].sort(
        (left, right) => right.bookabilityScore - left.bookabilityScore,
      ),
    [konkurrens.lagenhetKonkurrens],
  )

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Konkurrens</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Se vilka köpoäng som anmält intresse på vilka lägenheter. Vi antar att samma köpoäng =
          samma person (0 p ignoreras — det är systemets standard). Endast topp 5 syns per
          lägenhet.
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
          <label htmlFor="user-poang" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Dina köpoäng
          </label>
          <Input
            id="user-poang"
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

      {favorites.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Dina sparade lägenheter — sannolikhet att få</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Alla sparade lägenheter är lika prioriterade. Sorterade efter bokbarhet (högst först).
              Hovra över bokbarhet för topp 5 köpoäng och poängförklaring.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium">Lägenhet</th>
                  <th className="px-4 py-3 font-medium">Din plats</th>
                  <th className="px-4 py-3 font-medium">Bokbarhet</th>
                  <th className="px-4 py-3 font-medium">Konkurrens</th>
                </tr>
              </thead>
              <tbody>
                {favoriteKonkurrens.map((item) => (
                  <FavoriteKonkurrensRow
                    key={item.lagenhet.objektNr}
                    item={item}
                    userPoang={userPoang}
                    onNavigateToDetail={saveReturnToKonkurrens}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Virtuella användare</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Klicka på kolumnrubrikerna för att sortera. Personer som spridit sitt intresse brett
            är mindre sannolika att ta just den här lägenheten.
          </p>
        </div>

        {konkurrens.virtualUsers.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm text-muted-foreground">
            Ingen intressedata ännu. Kör scrapern med{' '}
            <code className="rounded bg-muted px-1 py-0.5">pnpm scraper:save</code> eller klicka
            &quot;Uppdatera live&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium">
                    <SortableTableHeader
                      sorted={
                        virtualUserSort.field === 'poang' ? virtualUserSort.direction : false
                      }
                      onClick={() => toggleVirtualUserSort('poang')}
                    >
                      Köpoäng
                    </SortableTableHeader>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <SortableTableHeader
                      sorted={
                        virtualUserSort.field === 'placements'
                          ? virtualUserSort.direction
                          : false
                      }
                      onClick={() => toggleVirtualUserSort('placements')}
                    >
                      Antal lägenheter
                    </SortableTableHeader>
                  </th>
                  <th className="px-4 py-3 font-medium">Lägenheter</th>
                </tr>
              </thead>
              <tbody>
                {sortedVirtualUsers.map((user) => (
                  <VirtualUserRow
                    key={user.poang}
                    user={user}
                    onNavigateToDetail={saveReturnToKonkurrens}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <button
          type="button"
          className="flex items-center gap-2 text-xl font-semibold"
          onClick={toggleShowAllLagenheter}
        >
          {showAllLagenheter ? (
            <ChevronDownIcon className="size-5" />
          ) : (
            <ChevronRightIcon className="size-5" />
          )}
          Alla lägenheter
        </button>

        {showAllLagenheter && (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium">Lägenhet</th>
                  <th className="px-4 py-3 font-medium">Intresse</th>
                  <th className="px-4 py-3 font-medium">Din plats</th>
                  <th className="px-4 py-3 font-medium">Bokbarhet</th>
                  <th className="px-4 py-3 font-medium">Konkurrens</th>
                </tr>
              </thead>
              <tbody>
                {sortedAllLagenheter.map((item) => (
                  <LagenhetKonkurrensRow
                    key={item.lagenhet.objektNr}
                    item={item}
                    userPoang={userPoang}
                    onNavigateToDetail={saveReturnToKonkurrens}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

type VirtualUserRowProps = {
  user: VirtualUser
  onNavigateToDetail: () => void
}

function VirtualUserRow({ user, onNavigateToDetail }: VirtualUserRowProps) {
  const [expanded, setExpanded] = useState(false)
  const preview = user.placements.slice(0, 3)
  const remaining = user.placements.length - preview.length

  return (
    <>
      <tr className="border-b">
        <td className="px-4 py-3 font-medium">{numberFormatter.format(user.poang)} p</td>
        <td className="px-4 py-3">{user.placements.length}</td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {preview.map((placement) => (
              <PlacementLink
                key={placement.objektNr}
                placement={placement}
                onNavigateToDetail={onNavigateToDetail}
              />
            ))}
            {remaining > 0 && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? 'Visa färre' : `+${remaining} till`}
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b bg-muted/20">
          <td colSpan={3} className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {user.placements.map((placement) => (
                <PlacementLink
                  key={placement.objektNr}
                  placement={placement}
                  onNavigateToDetail={onNavigateToDetail}
                />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

type PlacementLinkProps = {
  placement: VirtualUser['placements'][number]
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
      <span className="rounded bg-muted px-1 text-muted-foreground">#{placement.rank}</span>
    </Link>
  )
}

type FavoriteKonkurrensRowProps = {
  item: LagenhetKonkurrens
  userPoang: number | null
  onNavigateToDetail: () => void
}

function FavoriteKonkurrensRow({
  item,
  userPoang,
  onNavigateToDetail,
}: FavoriteKonkurrensRowProps) {
  return (
    <tr className="border-b">
      <td className="px-4 py-3">
        <Link
          to="/lagenhet/$objektNr"
          params={{ objektNr: item.lagenhet.objektNr }}
          onClick={onNavigateToDetail}
          className="font-medium hover:underline"
        >
          {item.lagenhet.adress}
        </Link>
        <p className="text-xs text-muted-foreground">{item.lagenhet.omrade}</p>
      </td>
      <td className="px-4 py-3">
        <UserRankCell item={item} />
      </td>
      <td className="px-4 py-3 font-medium">
        <BookabilityCell item={item} userPoang={userPoang} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {formatKonkurrensBreakdown(item)}
      </td>
    </tr>
  )
}

type LagenhetKonkurrensRowProps = {
  item: LagenhetKonkurrens
  userPoang: number | null
  onNavigateToDetail: () => void
}

function LagenhetKonkurrensRow({ item, userPoang, onNavigateToDetail }: LagenhetKonkurrensRowProps) {
  const antal = item.intresseStatus?.antalIntresseanmalningar

  return (
    <tr className="border-b">
      <td className="px-4 py-3">
        <Link
          to="/lagenhet/$objektNr"
          params={{ objektNr: item.lagenhet.objektNr }}
          onClick={onNavigateToDetail}
          className="font-medium hover:underline"
        >
          {item.lagenhet.adress}
        </Link>
        <p className="text-xs text-muted-foreground">{item.lagenhet.omrade}</p>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {antal != null ? `${numberFormatter.format(antal)} personer` : '—'}
      </td>
      <td className="px-4 py-3">
        <UserRankCell item={item} />
      </td>
      <td className="px-4 py-3 font-medium">
        <BookabilityCell item={item} userPoang={userPoang} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {formatKonkurrensBreakdown(item)}
      </td>
    </tr>
  )
}

function UserRankCell({ item }: { item: LagenhetKonkurrens }) {
  if (item.userWouldRank == null) {
    return <span className="text-muted-foreground">Ange dina köpoäng</span>
  }

  if (item.userBeatsAll) {
    return <span className="font-medium text-emerald-600 dark:text-emerald-400">Topp 1</span>
  }

  return <span>Plats {item.userWouldRank} i topp 5</span>
}

function formatKonkurrensBreakdown(item: LagenhetKonkurrens): string {
  const parts: string[] = []
  if (item.spreadCount > 0) {
    parts.push(`${item.spreadCount} spridd${item.spreadCount === 1 ? '' : 'a'}`)
  }
  if (item.dedicatedCount > 0) {
    parts.push(`${item.dedicatedCount} dedikerad${item.dedicatedCount === 1 ? '' : 'e'}`)
  }
  return parts.length > 0 ? parts.join(', ') : 'Ingen riktig anmälan i topp 5'
}

type SortableTableHeaderProps = {
  sorted: 'asc' | 'desc' | false
  onClick: () => void
  children: React.ReactNode
}

function SortableTableHeader({ sorted, onClick, children }: SortableTableHeaderProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 font-medium normal-case"
      onClick={onClick}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUpIcon className="size-4" />
      ) : sorted === 'desc' ? (
        <ArrowDownIcon className="size-4" />
      ) : (
        <ArrowUpDownIcon className="size-4 text-muted-foreground" />
      )}
    </Button>
  )
}
