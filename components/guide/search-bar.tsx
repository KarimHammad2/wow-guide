'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  variant?: 'default' | 'hero'
  placeholder?: string
  autoFocus?: boolean
  buildingSlug?: string
}

export function SearchBar({
  variant = 'default',
  placeholder = 'Search for help...',
  autoFocus = false,
  buildingSlug,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      const basePath = buildingSlug ? `/building/${buildingSlug}` : ''
      router.push(`${basePath}/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          'relative flex items-center w-full rounded-2xl transition-all duration-200',
          variant === 'hero'
            ? 'bg-card shadow-lg shadow-primary/5 border border-border'
            : 'bg-secondary border border-border'
        )}
      >
        <Search
          className={cn(
            'absolute left-4 text-muted-foreground',
            variant === 'hero' ? 'w-5 h-5' : 'w-4 h-4'
          )}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'w-full bg-transparent outline-none placeholder:text-muted-foreground',
            variant === 'hero'
              ? 'pl-12 pr-4 py-4 text-base'
              : 'pl-10 pr-4 py-3 text-sm'
          )}
        />
      </div>
    </form>
  )
}
