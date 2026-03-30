'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MobileMenu } from './mobile-menu'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/site/navbar'

interface HeaderProps {
  buildingName?: string
  buildingSlug?: string
  transparent?: boolean
}

export function Header({ buildingName, buildingSlug, transparent = false }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [language, setLanguage] = useState<'EN' | 'DE'>('EN')

  return (
    <>
      <Navbar
        brandLabel="WOW Living"
        logoSrc="/apple-icon.png"
        transparent={transparent}
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
          ) : (
            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/buildings"
                className="relative text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md px-2 py-1"
              >
                Buildings
              </Link>
            </nav>
          )
        }
        right={
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('gap-1.5 text-sm font-medium rounded-full', !transparent && 'hover:bg-secondary hover:text-secondary-foreground')}
                >
                  <Globe className="w-4 h-4" />
                  <span>{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[120px]">
                <DropdownMenuItem onClick={() => setLanguage('EN')}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('DE')}>
                  Deutsch
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              className={cn('relative rounded-full', !transparent && 'hover:bg-secondary hover:text-secondary-foreground')}
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </div>
        }
      />

      {/* Mobile Menu */}
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        buildingName={buildingName}
        buildingSlug={buildingSlug}
      />
    </>
  )
}
