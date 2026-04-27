'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { subscribeMobileMenuOpen } from '@/lib/mobile-menu-open'

/** Routes that render `StickyBottomBar` on small viewports (see grep for StickyBottomBar). */
function pathnameHasMobileStickyBar(pathname: string): boolean {
  if (pathname === '/' || pathname.startsWith('/admin')) return false
  if (pathname === '/buildings') return false
  if (pathname === '/search') return true
  if (pathname.startsWith('/category/')) return true
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 1) {
    return segments[0] !== 'buildings'
  }
  if (segments.length >= 2) {
    if (segments[1] === 'category') return true
    if (segments[1] === 'search') return true
  }
  return false
}

export function BackToTopButton() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => subscribeMobileMenuOpen(setMobileMenuOpen), [])

  useEffect(() => {
    if (pathname === '/' || pathname.startsWith('/admin')) return
    const onScroll = () => {
      setVisible(window.scrollY > 220)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  if (pathname === '/' || pathname.startsWith('/admin')) {
    return null
  }

  const aboveStickyBar = pathnameHasMobileStickyBar(pathname)

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={cn(
        'fixed right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-md bg-primary text-[#F4F2A2] shadow-lg transition-all duration-200 hover:brightness-105',
        aboveStickyBar
          ? 'max-md:bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6'
          : 'bottom-6',
        visible && !mobileMenuOpen
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      )}
    >
      <ArrowUp className="h-8 w-8 stroke-3" />
    </button>
  )
}
