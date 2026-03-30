'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminRequest } from '@/components/admin/admin-api'

export type AdminAccess = 'read-only' | 'full-access'

export function useAdminSession() {
  const router = useRouter()
  const [access, setAccess] = useState<AdminAccess>('full-access')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSession = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const me = await adminRequest<{ loggedIn: boolean; access: AdminAccess | null }>('/api/admin/me')
      if (!me.loggedIn) {
        router.push('/admin/login')
        return false
      }
      if (me.access) {
        setAccess(me.access)
      }
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to verify session'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const logout = useCallback(async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }, [router])

  return {
    access,
    canEdit: access === 'full-access',
    loading,
    error,
    setError,
    refreshSession,
    logout,
  }
}
