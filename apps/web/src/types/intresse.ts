export type IntresseStatus = {
  antalIntresseanmalningar: number | null
  topPoang: number[]
}

export type IntresseIndexFile = {
  fetchedAt: string
  data: Record<string, IntresseStatus>
}
