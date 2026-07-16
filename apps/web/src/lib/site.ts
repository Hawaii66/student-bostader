export const site = {
  name: 'Studentbostäder',
  description: 'Bläddra bland lediga studentlägenheter från Studentbostäder.',
  logo: '/logo.png',
  url: 'https://student-bostader.hawaiidev.sh',
} as const

export function pageTitle(page: string) {
  return `${page} | ${site.name}`
}
