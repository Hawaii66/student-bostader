/** Image URLs from the API 404 without width/height query params. */
export function withBildDimensions(
  url: string,
  width = 750,
  height = 435,
): string {
  const parsed = new URL(url)
  parsed.searchParams.set('width', String(width))
  parsed.searchParams.set('height', String(height))
  return parsed.toString()
}
