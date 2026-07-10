import { Link } from '@tanstack/react-router'

import { site } from '#/lib/site'

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-7xl items-center px-8 py-4">
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <img src={site.logo} alt="" className="size-8 rounded-md" />
          <span className="font-semibold">{site.name}</span>
        </Link>
      </div>
    </header>
  )
}
