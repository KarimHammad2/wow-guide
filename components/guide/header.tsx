'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MobileMenu } from './mobile-menu'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/site/navbar'

interface HeaderProps {
  buildingName?: string
  buildingSlug?: string
  supportEmail?: string
  transparent?: boolean
  /** Full-width flat top bar instead of the floating rounded navbar */
  flatNavbar?: boolean
  /** Static center label instead of the default "Buildings" link (e.g. "404" on not-found). */
  centerNavLabel?: string
}

export function Header({
  buildingName,
  buildingSlug,
  supportEmail,
  transparent = false,
  flatNavbar = false,
  centerNavLabel,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const showMenu = Boolean(buildingSlug)

  return (
    <>
      <Navbar
        brandHref="/buildings"
        brandLabel="WOW Living — all buildings"
        logoSrc="/apple-icon.png"
        transparent={transparent}
        variant={flatNavbar ? 'flat' : 'floating'}
        center={
          buildingName ? (
            <div className="hidden md:flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
                Building
              </span>
              <span className="text-sm font-medium text-foreground/90 truncate max-w-[22ch]">
                {buildingName}
              </span>
            </div>
          ) : centerNavLabel ? (
            <>
              <div className="hidden md:flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  {centerNavLabel}
                </span>
              </div>
              <span className="md:hidden text-sm font-medium text-muted-foreground tabular-nums min-h-10 inline-flex items-center justify-center">
                {centerNavLabel}
              </span>
            </>
          ) : (
            <>
              <nav className="hidden md:flex items-center gap-2" aria-label="Primary">
                <Link
                  href="/buildings"
                  className="relative text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md px-2 py-1"
                >
                  Buildings
                </Link>
              </nav>
              <Link
                href="/buildings"
                className="md:hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md px-2 py-1.5 min-h-10 inline-flex items-center justify-center"
              >
                Buildings
              </Link>
            </>
          )
        }
        right={
          showMenu ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(true)}
                className={cn(
                  'relative rounded-full',
                  !transparent && 'hover:bg-secondary hover:text-secondary-foreground',
                )}
              >
                <Menu className="w-5 h-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </div>
          ) : null
        }
      />

      {/* Mobile Menu */}
      {showMenu ? (
        <MobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          buildingName={buildingName}
          buildingSlug={buildingSlug}
          supportEmail={supportEmail}
        />
      ) : null}
    </>
  )
}
