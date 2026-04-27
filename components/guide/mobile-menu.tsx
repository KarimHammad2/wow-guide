'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Category } from '@/lib/data'
import { DEFAULT_SUPPORT_EMAIL } from '@/lib/emergency-defaults'
import { cn } from '@/lib/utils'
import { setMobileMenuOpen } from '@/lib/mobile-menu-open'
import { CategoryIconDisplay } from '@/components/guide/category-icon'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  buildingName?: string
  buildingSlug?: string
  supportEmail?: string
  /** Building guide sections from `getBuildingCategories` (same order as "All Topics"). */
  navCategories: Category[]
}

export function MobileMenu({
  open,
  onClose,
  buildingName,
  buildingSlug,
  supportEmail,
  navCategories,
}: MobileMenuProps) {
  // Prevent body scroll when menu is open; hide global UI (e.g. back-to-top) while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    setMobileMenuOpen(open)
    return () => {
      document.body.style.overflow = ''
      setMobileMenuOpen(false)
    }
  }, [open])

  const basePath = buildingSlug ? `/${buildingSlug}` : ''
  const resolvedSupportEmail =
    supportEmail?.trim() ||
    DEFAULT_SUPPORT_EMAIL

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-full max-w-sm bg-primary z-50 shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-primary-foreground/10">
            <div>
              <Link
                href="/buildings"
                onClick={onClose}
                className="block relative h-8 w-[72px] shrink-0 min-w-0"
              >
                <Image
                  src="/wow-wordmark-white.png"
                  alt="WOW"
                  fill
                  sizes="72px"
                  className="object-contain object-left"
                />
              </Link>
              {buildingName && (
                <p className="text-sm text-primary-foreground/70 mt-2">
                  {buildingName}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Categories */}
          <nav className="flex-1 px-2 py-4">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/50">
              Categories
            </p>
            <ul className="space-y-1">
              {navCategories.map((category) => {
                const href = buildingSlug
                  ? `/${buildingSlug}/category/${category.slug}`
                  : `/category/${category.slug}`
                return (
                  <li key={category.id}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-accent overflow-hidden">
                        <CategoryIconDisplay
                          icon={category.icon}
                          className="h-5 w-5"
                          imgClassName="h-5 w-5 object-cover"
                        />
                      </span>
                      <div>
                        <span className="font-medium">{category.title}</span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 space-y-3 border-t border-primary-foreground/10 safe-bottom">
            <Link href={`${basePath}/search`} onClick={onClose}>
              <Button
                variant="outline"
                className="w-full border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
              >
                Search Guide
              </Button>
            </Link>
            <a href={`mailto:${resolvedSupportEmail}`} onClick={onClose}>
              <Button
                variant="outline"
                className="w-full border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 gap-2 mt-2 mb-3"
              >
                <Mail className="w-4 h-4" />
                Contact
              </Button>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
