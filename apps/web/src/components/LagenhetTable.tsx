import { useEffect, useMemo, useRef, useState } from 'react'
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
            className="h-20 w-28 rounded object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('omrade', {
        header: 'Område',
        filterFn: inStringList,
        cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('adress', {
        header: 'Adress',
        filterFn: 'includesString',
        cell: (info) => <span className="text-gray-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('hyra', {
        header: 'Hyra',
        filterFn: inNumberRange,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-gray-900">
            {numberFormatter.format(row.original.hyra)} {row.original.hyraEnhet}
          </span>
        ),
      }),
      columnHelper.accessor('yta', {
        header: 'Storlek',
        filterFn: inNumberRange,
        cell: (info) => (
          <span className="whitespace-nowrap text-gray-900">{info.getValue()} m²</span>
        ),
      }),
      columnHelper.accessor('poang', {
        header: 'Max poäng just nu',
        filterFn: inNumberRange,
        cell: (info) => (
          <span className="whitespace-nowrap text-gray-900">
            {numberFormatter.format(info.getValue())} p
          </span>
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
    return <p className="text-gray-500">Inga lägenheter hittades.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
        <p>
          Visar {filteredCount} av {lagenheter.length} lägenheter
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => setColumnFilters([])}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Rensa filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
            <tr className="border-t border-gray-200 normal-case tracking-normal">
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <th key={`${header.id}-filter`} className="px-4 py-2 font-normal">
                  {header.column.getCanFilter() ? (
                    <ColumnFilter column={header.column} omraden={omraden} />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  Inga lägenheter matchar filtren.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.original.objektNr} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
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
      <input
        type="search"
        aria-label="Filtrera på adress"
        placeholder="Sök adress..."
        value={(filterValue as string) ?? ''}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 normal-case placeholder:text-gray-400"
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
        <input
          type="number"
          aria-label={label.min}
          placeholder={label.min}
          value={range.min ?? ''}
          min={0}
          onChange={(e) => updateRange('min', e.target.value)}
          className="w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 normal-case placeholder:text-gray-400"
        />
        <input
          type="number"
          aria-label={label.max}
          placeholder={label.max}
          value={range.max ?? ''}
          min={0}
          onChange={(e) => updateRange('max', e.target.value)}
          className="w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 normal-case placeholder:text-gray-400"
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
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = (column.getFilterValue() as string[] | undefined) ?? []

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

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
    <div ref={containerRef} className="relative min-w-36">
      <button
        type="button"
        aria-label="Filtrera på område"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded border border-gray-300 bg-white px-2 py-1.5 text-left text-sm text-gray-900 normal-case"
      >
        <span className="truncate">{label}</span>
        <span className="text-gray-400">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 max-h-48 w-full min-w-48 overflow-y-auto rounded border border-gray-200 bg-white py-1 shadow-lg">
          {omraden.map((omrade) => (
            <label
              key={omrade}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(omrade)}
                onChange={() => toggle(omrade)}
                className="rounded border-gray-300"
              />
              <span className="truncate">{omrade}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
