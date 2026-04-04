import { timingSafeEqual } from 'node:crypto'

function getConfiguredEmail() {
  return process.env.ADMIN_EMAIL?.trim() ?? ''
}

function getConfiguredPassword() {
  return process.env.ADMIN_PASSWORD ?? ''
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }
  return timingSafeEqual(leftBuffer, rightBuffer)
}

/** When set, these credentials can bootstrap or sign in as the primary owner (see login route). */
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
