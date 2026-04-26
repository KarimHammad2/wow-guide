'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { subscribeMobileMenuOpen } from '@/lib/mobile-menu-open'

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

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={cn(
        'fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-md bg-primary text-[#F4F2A2] shadow-lg transition-all duration-200 hover:brightness-105',
        visible && !mobileMenuOpen
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      )}
    >
      <ArrowUp className="h-8 w-8 stroke-3" />
    </button>
  )
}
