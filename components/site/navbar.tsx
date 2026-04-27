import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type NavbarLink = {
  label: string
  href: string
  external?: boolean
}

export type NavbarProps = {
  className?: string
  transparent?: boolean
  /** `floating` = rounded inner card (default). `flat` = full-width bar with bottom border. */
  variant?: 'floating' | 'flat'
  /** Replaces default flat bar background (e.g. solid CMS brand color). */
  flatInnerClassName?: string
  /**
   * Brand-colored floating shell: merges into the rounded “pill” and disables the default frosted-glass + gloss.
   * Used for category pages with a plum card while keeping the original rounded shape.
   */
  floatingBrandClassName?: string
  /** Applied to the logo `<Image>` (e.g. invert on dark bars). */
  logoImageClassName?: string
  brandHref?: string
  brandLabel?: string
  logoSrc?: string
  logoAlt?: string
  links?: NavbarLink[]
  center?: React.ReactNode
  right?: React.ReactNode
}

function LuxuryMark() {
  return (
    <div
      className={cn(
        'relative grid size-10 place-items-center rounded-2xl',
        'bg-linear-to-b from-primary/15 to-accent/20',
        'ring-1 ring-border/70 shadow-sm shadow-primary/10',
      )}
    >
      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,hsl(var(--color-accent))_0%,transparent_55%)] opacity-25" />
      <span className="relative text-sm font-semibold tracking-tight text-foreground">W</span>
    </div>
  )
}

function NavbarLinkItem({ href, label, external }: NavbarLink) {
  const common =
    'relative rounded-md px-3 py-1.5 text-[13px] font-medium tracking-[0.01em] text-muted-foreground transition-colors duration-300 ease-out hover:bg-secondary/80 hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'

  const underline =
    'after:absolute after:left-3 after:right-3 after:bottom-0 after:h-px after:origin-center after:scale-x-0 after:bg-foreground/45 after:transition-transform after:duration-300 hover:after:scale-x-100'

  if (external) {
    return (
      <a href={href} className={cn(common, underline)}>
        {label}
      </a>
    )
  }

  return (
    <Link href={href} className={cn(common, underline)}>
      {label}
    </Link>
  )
}

export function Navbar({
  className,
  transparent = false,
  variant = 'floating',
  flatInnerClassName,
  floatingBrandClassName,
  logoImageClassName,
  brandHref = '/',
  brandLabel = 'WOW Living',
  logoSrc,
  logoAlt = 'WOW Living',
  links,
  center,
  right,
}: NavbarProps) {
  const isFlat = variant === 'flat'
  const isBrandFloating = Boolean(floatingBrandClassName) && !isFlat

  const bar = (
    <div className="relative grid grid-cols-3 items-center px-5 py-3 md:px-6 md:py-3.5">
      {/* Left: Brand */}
      <Link
        href={brandHref}
        aria-label={brandLabel}
        className="flex items-center gap-3 min-w-0"
      >
        {logoSrc ? (
          <div className="relative h-8 w-28 min-w-0 sm:w-29 md:h-9 md:w-30">
            <Image
              src={logoSrc}
              alt={logoAlt}
              fill
              sizes="(min-width: 768px) 120px, 104px"
              className={cn('object-contain object-left', logoImageClassName)}
              priority
            />
          </div>
        ) : (
          <LuxuryMark />
        )}
      </Link>

      {/* Center: Links or custom */}
      <div className="flex items-center justify-center min-w-0">
        {center ? (
          center
        ) : links && links.length ? (
          <nav className="hidden md:flex items-center gap-3">
            {links.map((l) => (
              <NavbarLinkItem key={`${l.href}-${l.label}`} {...l} />
            ))}
          </nav>
        ) : null}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-2 min-w-0">{right}</div>
    </div>
  )

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 safe-top',
        transparent ? 'bg-transparent' : 'bg-background/60 backdrop-blur-xl dark:bg-background/35',
        !transparent && 'supports-backdrop-filter:bg-background/50 dark:supports-backdrop-filter:bg-background/30',
        className,
      )}
    >
      <div
        className={cn(
          'w-full',
          isFlat ? 'px-4 md:px-8 xl:px-14' : 'px-4 py-3 md:px-8 md:py-4 xl:px-14',
        )}
      >
        {isFlat ? (
          <div
            className={cn(
              'relative',
              flatInnerClassName
                ? null
                : 'border-b border-border/70 dark:border-border/55 bg-background/85 dark:bg-background/45 backdrop-blur-xl supports-backdrop-filter:bg-background/65 dark:supports-backdrop-filter:bg-background/35',
              flatInnerClassName,
            )}
          >
            {bar}
          </div>
        ) : (
          <div
            className={cn(
              'relative',
              isBrandFloating
                ? 'rounded-[28px] border shadow-[0_10px_30px_-20px_rgba(0,0,0,0.12)]'
                : 'rounded-[28px] border border-border/70 dark:border-border/55 bg-background/80 dark:bg-background/40 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)] dark:shadow-[0_10px_30px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl supports-backdrop-filter:bg-background/60 dark:supports-backdrop-filter:bg-background/30',
              floatingBrandClassName,
            )}
          >
            {!isBrandFloating && (
              <>
                <div className="absolute inset-0 rounded-[28px] bg-[linear-gradient(110deg,transparent,rgba(155,90,116,0.10),transparent)] opacity-35 dark:opacity-20 pointer-events-none" />
                <div className="absolute inset-px rounded-[27px] border border-white/45 dark:border-white/10 pointer-events-none" />
              </>
            )}
            {bar}
          </div>
        )}
      </div>
    </header>
  )
}

