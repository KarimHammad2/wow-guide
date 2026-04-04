'use client'

import { useEffect, useState } from 'react'
import { HelpCircle, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supportContacts } from '@/lib/data'
import { DEFAULT_SUPPORT_EMAIL, DEFAULT_SUPPORT_PHONE } from '@/lib/emergency-defaults'
import { cn } from '@/lib/utils'

interface NeedHelpCardProps {
  className?: string
}

export function NeedHelpCard({ className }: NeedHelpCardProps) {
  const [contact, setContact] = useState({
    phone: DEFAULT_SUPPORT_PHONE,
    email: DEFAULT_SUPPORT_EMAIL,
  })

  useEffect(() => {
    void fetch('/api/public/emergency')
      .then((res) => res.json())
      .then(
        (data: { primary?: { phone: string; email: string } }) => {
          if (data?.primary?.phone && data?.primary?.email) {
            setContact({ phone: data.primary.phone, email: data.primary.email })
          }
        },
        () => {
          /* keep defaults */
        }
      )
  }, [])

  return (
    <div
      className={cn(
        'rounded-2xl bg-secondary border border-border p-5',
        className
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Need Help?</h3>
          <p className="text-sm text-muted-foreground">
            {"We're here to assist you"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 bg-card border-border hover:bg-secondary"
          >
            <Phone className="w-4 h-4 text-primary" />
            <span>{contact.phone}</span>
          </Button>
        </a>
        <a href={`mailto:${contact.email}`}>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 bg-card border-border hover:bg-secondary mt-2"
          >
            <Mail className="w-4 h-4 text-primary" />
            <span>{contact.email}</span>
          </Button>
        </a>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        {supportContacts.general.hours}
      </p>
    </div>
  )
}
