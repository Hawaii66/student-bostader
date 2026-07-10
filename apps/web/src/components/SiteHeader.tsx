import { Link } from '@tanstack/react-router'

import { site } from '#/lib/site'

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-8 py-4">
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <img src={site.logo} alt="" className="size-8 rounded-md" />
          <span className="font-semibold">{site.name}</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'font-medium text-foreground' }}
          >
            Lediga lägenheter
          </Link>
          <Link
            to="/konkurrens"
            className="text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'font-medium text-foreground' }}
          >
            Konkurrens
          </Link>
        </nav>
      </div>
    </header>
  )
}
