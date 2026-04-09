'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Lock, Mail, ArrowRight, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isSafeRelativePath } from '@/lib/url-safety'
import { cn } from '@/lib/utils'

export function AdminLoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestedNext = searchParams.get('next')
  const next = requestedNext && isSafeRelativePath(requestedNext) ? requestedNext : '/admin'
  const invalid = Boolean(error)

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        setError(payload?.error || 'Unable to sign in. Check credentials and try again.')
        return
      }
      router.push(next)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-6xl grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] xl:gap-10">
        <section
          className={cn(
            'rounded-3xl border border-border/60 bg-card/80 backdrop-blur-md p-8 md:p-10 shadow-[0_35px_80px_-60px_rgba(83,35,56,0.85)]',
            'animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both',
          )}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="relative h-9 w-[7.5rem] shrink-0">
              <Image
                src="/logo.svg"
                alt="WOW Living"
                fill
                sizes="120px"
                className="object-contain object-left"
                priority
              />
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              WOW Admin Access
            </div>
          </div>

          <h1 className="mt-6 font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Welcome to the Admin Control Center
          </h1>
          <p className="mt-3 text-base text-foreground/85 max-w-prose leading-snug">
            One workspace for your building guide, teams, and emergency information.
          </p>
          <p className="mt-2 text-muted-foreground max-w-prose leading-relaxed">
            Manage emergency info, teams, cities, buildings, and guide sections in one place with a
            clean professional workflow.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-3">
            <div className="group rounded-2xl border border-border bg-background/70 p-4 transition-all duration-200 hover:border-primary/25 hover:bg-background hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background text-primary transition-colors group-hover:border-primary/20">
                  <Shield className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Security</p>
                  <p className="mt-1.5 font-semibold text-foreground leading-snug">
                    Session-protected admin area
                  </p>
                </div>
              </div>
            </div>
            <div className="group rounded-2xl border border-border bg-background/70 p-4 transition-all duration-200 hover:border-primary/25 hover:bg-background hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background text-primary transition-colors group-hover:border-primary/20">
                  <Zap className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Productivity</p>
                  <p className="mt-1.5 font-semibold text-foreground leading-snug">
                    Fast CRUD and instant data updates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Card
          className={cn(
            'rounded-3xl border-border/70 bg-card/90 backdrop-blur-md shadow-[0_25px_60px_-45px_rgba(0,0,0,0.65)]',
            'animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both',
          )}
        >
          <CardHeader>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription className="text-foreground/70">
              Sign in with your staff email and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    className="h-11 rounded-lg pl-10"
                    aria-invalid={invalid}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-11 rounded-lg pl-10"
                    aria-invalid={invalid}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-11 gap-2 rounded-lg shadow-sm transition-transform hover:shadow-md active:scale-[0.99]"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in to Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
