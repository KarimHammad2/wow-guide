'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MobileMenu } from './mobile-menu'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/site/navbar'
import type { Category } from '@/lib/data'

interface HeaderProps {
  buildingName?: string
  buildingSlug?: string
  supportEmail?: string
  /** Sections for the slide-out menu (must match the building; omit only when the menu is hidden). */
  navCategories?: Category[]
  transparent?: boolean
  /** Full-width flat top bar instead of the floating rounded navbar */
  flatNavbar?: boolean
  /** Static center label instead of the default "Buildings" link (e.g. "404" on not-found). */
  centerNavLabel?: string
  /**
   * CMS / legal pages: plum bar, white type, center shows page title (no generic "Buildings" link).
   */
  sitePage?: {
    title: string
  }
  /**
   * Category guides (static `/category/...`, per-building `/slug/category/...`): plum top bar + white perspective wordmark.
   */
  plumNav?: boolean
}

export function Header({
  buildingName,
  buildingSlug,
  supportEmail,
  navCategories = [],
  transparent = false,
  flatNavbar = false,
  centerNavLabel,
  sitePage,
  plumNav = false,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const showMenu = Boolean(buildingSlug)
  const brandHref = '/buildings'
  const plumSurface = Boolean(sitePage) || plumNav
  /** Flat full-width bar is only for CMS `sitePage` (explicit layout). Category guides use floating shape + plum. */
  const useFlatBar = flatNavbar || Boolean(sitePage)
  const plumFloating = plumSurface && !sitePage

  const sitePageCenter = sitePage ? (
    <>
      <div className="hidden md:flex flex-col items-center text-center px-2 min-w-0">
        <span className="text-[11px] uppercase tracking-[0.22em] text-white/75">WOW Living</span>
        <span className="text-sm font-medium text-white truncate max-w-[min(32ch,100%)]">{sitePage.title}</span>
      </div>
      <div className="md:hidden flex flex-col items-center text-center px-1 min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/75">WOW Living</span>
        <span className="text-xs font-medium text-white line-clamp-2 max-w-[20ch]">{sitePage.title}</span>
      </div>
    </>
  ) : null

  return (
    <>
      <Navbar
        brandHref={brandHref}
        brandLabel="WOW Living — all buildings"
        logoSrc={plumSurface ? '/wow-wordmark-white.png' : '/wow-wordmark.png'}
        transparent={transparent}
        variant={useFlatBar ? 'flat' : 'floating'}
        className={
          plumSurface
            ? 'text-white !bg-[#9A5477] backdrop-blur-none supports-backdrop-filter:!bg-[#9A5477] dark:!bg-[#9A5477] dark:supports-backdrop-filter:!bg-[#9A5477]'
            : undefined
        }
        flatInnerClassName={
          sitePage
            ? '!border-white/20 !bg-[#9A5477] shadow-none !backdrop-blur-none supports-backdrop-filter:!bg-[#9A5477] dark:!bg-[#9A5477] dark:supports-backdrop-filter:!bg-[#9A5477]'
            : undefined
        }
        floatingBrandClassName={
          plumFloating
            ? '!bg-[#9A5477] !border-white/20 shadow-none !backdrop-blur-none supports-backdrop-filter:!bg-[#9A5477] dark:!bg-[#9A5477] dark:supports-backdrop-filter:!bg-[#9A5477]'
            : undefined
        }
        center={
          sitePage ? (
            sitePageCenter
          ) : buildingName ? (
            <div className="hidden md:flex flex-col items-center">
              <span
                className={cn(
                  'text-[11px] uppercase tracking-[0.22em]',
                  plumSurface ? 'text-white/70' : 'text-muted-foreground/70',
                )}
              >
                Building
              </span>
              <span
                className={cn(
                  'text-sm font-medium truncate max-w-[22ch]',
                  plumSurface ? 'text-white' : 'text-foreground/90',
                )}
              >
                {buildingName}
              </span>
            </div>
          ) : centerNavLabel ? (
            <>
              <div className="hidden md:flex items-center justify-center">
                <span
                  className={cn(
                    'text-sm font-medium tabular-nums',
                    plumSurface ? 'text-white/85' : 'text-muted-foreground',
                  )}
                >
                  {centerNavLabel}
                </span>
              </div>
              <span
                className={cn(
                  'md:hidden text-sm font-medium tabular-nums min-h-10 inline-flex items-center justify-center',
                  plumSurface ? 'text-white/85' : 'text-muted-foreground',
                )}
              >
                {centerNavLabel}
              </span>
            </>
          ) : (
            <>
              <nav className="hidden md:flex items-center gap-2" aria-label="Primary">
                <Link
                  href="/buildings"
                  className={cn(
                    'relative text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md px-2 py-1',
                    plumSurface
                      ? 'text-white/90 hover:bg-white/10 hover:text-white'
                      : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground',
                  )}
                >
                  Buildings
                </Link>
              </nav>
              <Link
                href="/buildings"
                className={cn(
                  'md:hidden text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md px-2 py-1.5 min-h-10 inline-flex items-center justify-center',
                  plumSurface ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-foreground',
                )}
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
                  plumSurface && 'text-white hover:bg-white/10 hover:text-white',
                  !plumSurface && !transparent && 'hover:bg-secondary hover:text-secondary-foreground',
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
          navCategories={navCategories}
        />
      ) : null}
    </>
  )
}
