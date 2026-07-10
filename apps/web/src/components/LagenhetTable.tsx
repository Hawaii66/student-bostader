import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  type Column,
  type ColumnFiltersState,
  type FilterFn,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

type LagenhetTableProps = {
  lagenheter: Lagenhet[]
}

export function LagenhetTable({ lagenheter }: LagenhetTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const omraden = useMemo(
    () => [...new Set(lagenheter.map((l) => l.omrade))].sort((a, b) => a.localeCompare(b, 'sv')),
    [lagenheter],
  )

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'bild',
        header: 'Bild',
        cell: ({ row }) => (
          <img
            src={row.original.bildUrl}
            alt={row.original.adress}
            className="h-20 w-28 rounded-md object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('omrade', {
        header: 'Område',
        filterFn: inStringList,
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('adress', {
        header: 'Adress',
        filterFn: 'includesString',
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
    [],
  )

  const table = useReactTable({
    data: lagenheter,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const hasActiveFilters = columnFilters.some((filter) => {
    const value = filter.value
    if (value === undefined || value === '' || value === null) return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object' && value !== null) {
      const range = value as RangeFilterValue
      return range.min !== undefined || range.max !== undefined
    }
    return true
  })

  if (lagenheter.length === 0) {
    return <p className="text-muted-foreground">Inga lägenheter hittades.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          Visar {filteredCount} av {lagenheter.length} lägenheter
        </p>
        {hasActiveFilters && (
          <Button type="button" variant="link" size="sm" onClick={() => setColumnFilters([])}>
            Rensa filter
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
            <TableRow className="hover:bg-transparent">
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <TableHead key={`${header.id}-filter`} className="px-4 font-normal">
                  {header.column.getCanFilter() ? (
                    <ColumnFilter column={header.column} omraden={omraden} />
                  ) : null}
                </TableHead>
              ))}
            </TableRow>
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
                <TableRow key={row.original.objektNr}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

type ColumnFilterProps = {
  column: Column<Lagenhet, unknown>
  omraden: string[]
}

function ColumnFilter({ column, omraden }: ColumnFilterProps) {
  if (!column) return null

  const filterValue = column.getFilterValue()

  if (column.id === 'omrade') {
    return <OmradeMultiSelect column={column} omraden={omraden} />
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
      <div className="flex gap-1">
        <Input
          type="number"
          aria-label={label.min}
          placeholder={label.min}
          value={range.min ?? ''}
          min={0}
          onChange={(e) => updateRange('min', e.target.value)}
          className="min-w-0 normal-case"
        />
        <Input
          type="number"
          aria-label={label.max}
          placeholder={label.max}
          value={range.max ?? ''}
          min={0}
          onChange={(e) => updateRange('max', e.target.value)}
          className="min-w-0 normal-case"
        />
      </div>
    )
  }

  return null
}

type OmradeMultiSelectProps = {
  column: Column<Lagenhet, unknown>
  omraden: string[]
}

function OmradeMultiSelect({ column, omraden }: OmradeMultiSelectProps) {
  const selected = (column.getFilterValue() as string[] | undefined) ?? []

  const toggle = (omrade: string) => {
    const next = selected.includes(omrade)
      ? selected.filter((value) => value !== omrade)
      : [...selected, omrade]

    column.setFilterValue(next.length ? next : undefined)
  }

  const label =
    selected.length === 0
      ? 'Alla områden'
      : selected.length === 1
        ? selected[0]
        : `${selected.length} valda`

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Filtrera på område"
            className="w-full min-w-36 justify-between font-normal normal-case"
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDownIcon className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <div className="max-h-48 overflow-y-auto">
          {omraden.map((omrade) => (
            <label
              key={omrade}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
            >
              <Checkbox
                checked={selected.includes(omrade)}
                onCheckedChange={() => toggle(omrade)}
              />
              <span className="truncate text-sm">{omrade}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
