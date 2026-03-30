import { Suspense } from 'react'
import { AdminLoginClient } from './admin-login-client'

function LoginFallback() {
  return (
    <main className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-6xl rounded-3xl border border-border/60 bg-card/80 p-10 shadow-sm">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mt-6 h-10 w-3/4 max-w-md animate-pulse rounded-md bg-muted" />
        <div className="mt-4 h-4 w-full max-w-lg animate-pulse rounded-md bg-muted/70" />
      </div>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <AdminLoginClient />
    </Suspense>
  )
}
