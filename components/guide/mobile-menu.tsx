'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X, Phone, AlertTriangle, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { categories } from '@/lib/data'
import { cn } from '@/lib/utils'
import { getLucideIcon } from '@/lib/icons'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  buildingName?: string
  buildingSlug?: string
}

export function MobileMenu({ open, onClose, buildingName, buildingSlug }: MobileMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const basePath = buildingSlug ? `/building/${buildingSlug}` : ''

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
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-accent-foreground font-bold text-sm">
                  W
                </div>
                <span className="font-bold text-primary-foreground">
                  WOW Guide
                </span>
              </div>
              {buildingName && (
                <p className="text-sm text-primary-foreground/70 mt-1">
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

          {/* Language Selector */}
          <div className="px-4 py-3 border-b border-primary-foreground/10">
            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <Globe className="w-4 h-4" />
              <span>Language</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                English
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
              >
                Deutsch
              </Button>
            </div>
          </div>

          {/* Categories */}
          <nav className="flex-1 px-2 py-4">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/50">
              Categories
            </p>
            <ul className="space-y-1">
              {categories.map((category) => {
                const Icon = getLucideIcon(category.icon)
                const href = buildingSlug 
                  ? `/building/${buildingSlug}/category/${category.slug}`
                  : `/category/${category.slug}`
                return (
                  <li key={category.id}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-accent" />
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
            <a href="tel:+41610000000">
              <Button
                variant="outline"
                className="w-full border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 gap-2 mt-2"
              >
                <Phone className="w-4 h-4" />
                Contact Support
              </Button>
            </a>
            <Link href={`${basePath}/category/emergency`} onClick={onClose}>
              <Button className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2 mt-2 mb-3">
                <AlertTriangle className="w-4 h-4" />
                Emergency
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
