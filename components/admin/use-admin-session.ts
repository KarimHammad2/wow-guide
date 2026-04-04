'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminRequest } from '@/components/admin/admin-api'

export type StaffRole = 'owner' | 'member'

export function useAdminSession() {
  const router = useRouter()
  const [role, setRole] = useState<StaffRole | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSession = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const me = await adminRequest<{
        loggedIn: boolean
        role: StaffRole | null
        email?: string | null
        canEdit: boolean
        canManageTeam: boolean
      }>('/api/admin/me')
      if (!me.loggedIn) {
        setEmail(null)
        router.push('/admin/login')
        return false
      }
      if (me.role) {
        setRole(me.role)
      }
      setEmail(typeof me.email === 'string' ? me.email : null)
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

  const canManageTeam = role === 'owner'

  return {
    role,
    email,
    canEdit: true,
    canManageTeam,
    loading,
    error,
    setError,
    refreshSession,
    logout,
  }
}
