import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { createServerFn } from '@tanstack/react-start'

import type { Lagenhet } from '#/types/lagenhet'

export const getLagenheter = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Lagenhet[]> => {
    const filePath = join(process.cwd(), 'public/lagenheter.json')
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw) as Lagenhet[]
  },
)
