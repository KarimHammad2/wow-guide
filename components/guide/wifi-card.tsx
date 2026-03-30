'use client'

import { useState } from 'react'
import { Wifi, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WifiCardProps {
  networkName: string
  password: string
  className?: string
}

export function WifiCard({ networkName, password, className }: WifiCardProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<'name' | 'password' | null>(null)

  const copyToClipboard = async (text: string, type: 'name' | 'password') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl bg-primary text-primary-foreground overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
          <Wifi className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">WiFi Connection</h3>
          <p className="text-sm text-primary-foreground/70">
            High-speed internet
          </p>
        </div>
      </div>

      {/* Credentials */}
      <div className="px-5 pb-5 space-y-3">
        {/* Network Name */}
        <div className="p-4 rounded-xl bg-primary-foreground/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-foreground/60 uppercase tracking-wider mb-1">
                Network Name
              </p>
              <p className="font-medium">{networkName}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(networkName, 'name')}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              {copied === 'name' ? (
                <Check className="w-4 h-4 text-accent" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="p-4 rounded-xl bg-primary-foreground/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-foreground/60 uppercase tracking-wider mb-1">
                Password
              </p>
              <p className="font-medium font-mono">
                {showPassword ? password : '••••••••••••'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(password, 'password')}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                {copied === 'password' ? (
                  <Check className="w-4 h-4 text-accent" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
