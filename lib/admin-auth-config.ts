import { timingSafeEqual } from 'node:crypto'

function getConfiguredEmail() {
  const raw = process.env.ADMIN_EMAIL?.trim()
  if (raw) return raw
  return process.env.NODE_ENV === 'production' ? '' : 'admin@wowliving.ch'
}

function getConfiguredPassword() {
  const raw = process.env.ADMIN_PASSWORD ?? ''
  if (raw) return raw
  return process.env.NODE_ENV === 'production' ? '' : 'admin123'
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }
  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function isAdminAuthConfigured() {
  return Boolean(getConfiguredEmail() && getConfiguredPassword())
}

export function isValidAdminLogin(email: string, password: string) {
  const configuredEmail = getConfiguredEmail()
  const configuredPassword = getConfiguredPassword()
  if (!configuredEmail || !configuredPassword) {
    return false
  }
  return safeEqual(email.trim(), configuredEmail) && safeEqual(password, configuredPassword)
}
