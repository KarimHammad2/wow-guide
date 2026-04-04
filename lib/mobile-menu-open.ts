const listeners = new Set<(open: boolean) => void>()
let current = false

export function setMobileMenuOpen(open: boolean) {
  if (current === open) return
  current = open
  for (const fn of listeners) fn(open)
}

export function subscribeMobileMenuOpen(fn: (open: boolean) => void) {
  listeners.add(fn)
  fn(current)
  return () => {
    listeners.delete(fn)
  }
}
