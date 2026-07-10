import { useMemo, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type Column,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  HeartIcon,
  ListFilterIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { withBildDimensions } from '@/lib/bilder'
import type { Lagenhet } from '#/types/lagenhet'

const numberFormatter = new Intl.NumberFormat('sv-SE')

type RangeFilterValue = {
  min?: number
  max?: number
}

const inNumberRange: FilterFn<Lagenhet> = (row, columnId, filterValue) => {
  const range = filterValue as RangeFilterValue
  const value = row.getValue<number>(columnId)

  if (range.min !== undefined && value < range.min) return false
  if (range.max !== undefined && value > range.max) return false

  return true
}

const inStringList: FilterFn<Lagenhet> = (row, columnId, filterValue) => {
  const selected = filterValue as string[]
  if (!selected?.length) return true
  return selected.includes(row.getValue(columnId) as string)
}

const columnHelper = createColumnHelper<Lagenhet>()

const swedishStringSort = (rowA: { getValue: (id: string) => unknown }, rowB: { getValue: (id: string) => unknown }, columnId: string) =>
  (rowA.getValue(columnId) as string).localeCompare(rowB.getValue(columnId) as string, 'sv')

type LagenhetTableProps = {
  lagenheter: Lagenhet[]
  isFavorite: (objektNr: string) => boolean
  onToggleFavorite: (lagenhet: Lagenhet) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (filters: ColumnFiltersState) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  showOnlyFavorites?: boolean
  onShowOnlyFavoritesChange?: (value: boolean) => void
}

export function LagenhetTable({
  lagenheter,
  isFavorite,
  onToggleFavorite,
  columnFilters,
  onColumnFiltersChange,
  sorting,
  onSortingChange,
  showOnlyFavorites = false,
  onShowOnlyFavoritesChange,
}: LagenhetTableProps) {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)

  const visibleLagenheter = useMemo(
    () =>
      showOnlyFavorites
        ? lagenheter.filter((lagenhet) => isFavorite(lagenhet.objektNr))
        : lagenheter,
    [lagenheter, showOnlyFavorites, isFavorite],
  )

  const omraden = useMemo(
    () =>
      [...new Set(visibleLagenheter.map((l) => l.omrade))].sort((a, b) => a.localeCompare(b, 'sv')),
    [visibleLagenheter],
  )

  const typer = useMemo(
    () =>
      [...new Set(visibleLagenheter.map((l) => l.typOvergripande))].sort((a, b) =>
        a.localeCompare(b, 'sv'),
      ),
    [visibleLagenheter],
  )

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'favorite',
        header: '',
        cell: ({ row }) => {
          const favorited = isFavorite(row.original.objektNr)

          return (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={favorited ? 'Ta bort från sparade' : 'Spara lägenhet'}
              aria-pressed={favorited}
              onClick={() => onToggleFavorite(row.original)}
            >
              <HeartIcon
                className={cn(favorited && 'fill-red-500 text-red-500')}
              />
            </Button>
          )
        },
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: 'bild',
        header: 'Bild',
        cell: ({ row }) => (
          <div className="aspect-video w-48 shrink-0 overflow-hidden rounded-md bg-muted">
            <img
              src={withBildDimensions(row.original.bildUrl, 640, 360)}
              alt={row.original.adress}
              className="size-full object-cover"
              loading="lazy"
            />
          </div>
        ),
        enableColumnFilter: false,
        enableSorting: false,
      }),
      columnHelper.accessor('omrade', {
        header: 'Område',
        filterFn: inStringList,
        sortingFn: swedishStringSort,
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('typOvergripande', {
        header: 'Typ',
        filterFn: inStringList,
        sortingFn: swedishStringSort,
        cell: (info) => <span className="whitespace-nowrap">{info.getValue()}</span>,
      }),
      columnHelper.accessor('adress', {
        header: 'Adress',
        filterFn: 'includesString',
        sortingFn: swedishStringSort,
      }),
      columnHelper.accessor('hyra', {
        header: 'Hyra',
        filterFn: inNumberRange,
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {numberFormatter.format(row.original.hyra)} {row.original.hyraEnhet}
          </span>
        ),
      }),
      columnHelper.accessor('yta', {
        header: 'Storlek',
        filterFn: inNumberRange,
        cell: (info) => <span className="whitespace-nowrap">{info.getValue()} m²</span>,
      }),
      columnHelper.accessor('poang', {
        header: 'Max poäng just nu',
        filterFn: inNumberRange,
        cell: (info) => (
          <span className="whitespace-nowrap">{numberFormatter.format(info.getValue())} p</span>
        ),
      }),
    ],
    [isFavorite, onToggleFavorite],
  )

  const table = useReactTable({
    data: visibleLagenheter,
    columns,
    state: { columnFilters, sorting },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === 'function' ? updater(columnFilters) : updater
      onColumnFiltersChange(next)
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      onSortingChange(next)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const hasActiveFilters =
    showOnlyFavorites ||
    columnFilters.some((filter) => {
    const value = filter.value
    if (value === undefined || value === '' || value === null) return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object' && value !== null) {
      const range = value as RangeFilterValue
      return range.min !== undefined || range.max !== undefined
    }
      return true
    })

  const clearFilters = () => {
    onColumnFiltersChange([])
    onShowOnlyFavoritesChange?.(false)
  }

  if (lagenheter.length === 0) {
    return <p className="text-muted-foreground">Inga lägenheter hittades.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          {showOnlyFavorites ? (
            <>
              Visar {filteredCount} av {visibleLagenheter.length} sparade lägenheter
            </>
          ) : (
            <>Visar {filteredCount} av {lagenheter.length} lägenheter</>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFilterDialogOpen(true)}
          >
            <ListFilterIcon />
            Filter
            {hasActiveFilters && (
              <span className="size-2 rounded-full bg-primary" aria-hidden />
            )}
          </Button>
          {hasActiveFilters && (
            <Button type="button" variant="link" size="sm" onClick={clearFilters}>
              Rensa filter
            </Button>
          )}
        </div>
      </div>

      <LagenhetFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        table={table}
        omraden={omraden}
        typer={typer}
        filteredCount={filteredCount}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.id === 'bild' ? 'w-48 min-w-48 px-4' : 'px-4'}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <SortableHeader column={header.column}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </SortableHeader>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  Inga lägenheter matchar filtren.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.original.objektNr} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => {
                    const content = flexRender(cell.column.columnDef.cell, cell.getContext())

                    return (
                      <TableCell
                        key={cell.id}
                        className={cell.column.id === 'bild' ? 'w-48 min-w-48 p-0' : 'p-0'}
                      >
                        {cell.column.id === 'favorite' ? (
                          <div className="px-4 py-3">{content}</div>
                        ) : (
                          <Link
                            to="/lagenhet/$objektNr"
                            params={{ objektNr: row.original.objektNr }}
                            className="block px-4 py-3 text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            aria-label={
                              cell.column.id === 'bild'
                                ? `Visa detaljer för ${row.original.adress}`
                                : undefined
                            }
                            tabIndex={cell.column.id === 'bild' ? 0 : -1}
                          >
                            {content}
                          </Link>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const filterLabels: Record<string, string> = {
  omrade: 'Område',
  typOvergripande: 'Typ',
  adress: 'Adress',
  hyra: 'Hyra',
  yta: 'Storlek',
  poang: 'Max poäng just nu',
}

type LagenhetFilterDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: ReturnType<typeof useReactTable<Lagenhet>>
  omraden: string[]
  typer: string[]
  filteredCount: number
  hasActiveFilters: boolean
  onClearFilters: () => void
}

function LagenhetFilterDialog({
  open,
  onOpenChange,
  table,
  omraden,
  typer,
  filteredCount,
  hasActiveFilters,
  onClearFilters,
}: LagenhetFilterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Filter</DialogTitle>
          <DialogDescription>Filtrera listan efter dina önskemål.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 overflow-y-auto px-6 py-4">
          {table
            .getAllColumns()
            .filter((column) => column.getCanFilter())
            .map((column) => (
              <FilterField key={column.id} label={filterLabels[column.id] ?? column.id}>
                <ColumnFilter column={column} omraden={omraden} typer={typer} />
              </FilterField>
            ))}
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          {hasActiveFilters && (
            <Button type="button" variant="outline" onClick={onClearFilters}>
              Rensa
            </Button>
          )}
          <Button type="button" onClick={() => onOpenChange(false)}>
            Visa {filteredCount} resultat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type FilterFieldProps = {
  label: string
  children: ReactNode
}

function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  )
}

type SortableHeaderProps = {
  column: Column<Lagenhet, unknown>
  children: ReactNode
}

function SortableHeader({ column, children }: SortableHeaderProps) {
  const sorted = column.getIsSorted()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 font-medium normal-case"
      onClick={() => column.toggleSorting()}
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

type ColumnFilterProps = {
  column: Column<Lagenhet, unknown>
  omraden: string[]
  typer: string[]
}

function ColumnFilter({ column, omraden, typer }: ColumnFilterProps) {
  if (!column) return null

  const filterValue = column.getFilterValue()

  if (column.id === 'omrade') {
    return (
      <StringMultiSelect
        column={column}
        options={omraden}
        ariaLabel="Filtrera på område"
      />
    )
  }

  if (column.id === 'typOvergripande') {
    return (
      <StringMultiSelect
        column={column}
        options={typer}
        ariaLabel="Filtrera på bostadstyp"
      />
    )
  }

  if (column.id === 'adress') {
    return (
      <Input
        type="search"
        aria-label="Filtrera på adress"
        placeholder="Sök adress..."
        value={(filterValue as string) ?? ''}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        className="normal-case"
      />
    )
  }

  if (column.id === 'hyra' || column.id === 'yta' || column.id === 'poang') {
    const range = (filterValue as RangeFilterValue | undefined) ?? {}
    const labels: Record<string, { min: string; max: string }> = {
      hyra: { min: 'Min hyra', max: 'Max hyra' },
      yta: { min: 'Min m²', max: 'Max m²' },
      poang: { min: 'Min poäng', max: 'Max poäng' },
    }
    const label = labels[column.id]

    const updateRange = (key: 'min' | 'max', raw: string) => {
      if (raw === '') {
        const next: RangeFilterValue = { ...range, [key]: undefined }
        if (next.min === undefined && next.max === undefined) {
          column.setFilterValue(undefined)
        } else {
          column.setFilterValue(next)
        }
        return
      }

      const parsed = Number(raw)
      if (Number.isNaN(parsed)) return

      column.setFilterValue({ ...range, [key]: parsed })
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          aria-label={label.min}
          placeholder={label.min}
          value={range.min ?? ''}
          min={0}
          onChange={(e) => updateRange('min', e.target.value)}
          className="normal-case"
        />
        <Input
          type="number"
          aria-label={label.max}
          placeholder={label.max}
          value={range.max ?? ''}
          min={0}
          onChange={(e) => updateRange('max', e.target.value)}
          className="normal-case"
        />
      </div>
    )
  }

  return null
}

type StringMultiSelectProps = {
  column: Column<Lagenhet, unknown>
  options: string[]
  ariaLabel: string
}

function StringMultiSelect({ column, options, ariaLabel }: StringMultiSelectProps) {
  const selected = (column.getFilterValue() as string[] | undefined) ?? []

  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((value) => value !== option)
      : [...selected, option]

    column.setFilterValue(next.length ? next : undefined)
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2"
    >
      {options.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
        >
          <Checkbox
            checked={selected.includes(option)}
            onCheckedChange={() => toggle(option)}
          />
          <span className="truncate text-sm">{option}</span>
        </label>
      ))}
    </div>
  )
}
