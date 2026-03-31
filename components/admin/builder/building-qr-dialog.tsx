'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { Loader2, Printer, QrCode, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Building } from '@/lib/data'
import { toAbsoluteSiteUrl } from '@/lib/site-url'

type BuildingQrDialogProps = {
  building: Building | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CARD_WIDTH = 1200
const CARD_HEIGHT = 1600

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`))
    image.src = src
  })
}

export function BuildingQrDialog({ building, open, onOpenChange }: BuildingQrDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [loadingQr, setLoadingQr] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const publicUrl = useMemo(() => {
    if (!building) return ''
    return toAbsoluteSiteUrl(`/building/${building.id}`)
  }, [building])

  useEffect(() => {
    if (!open || !building || !publicUrl) return
    let cancelled = false

    setLoadingQr(true)
    setError(null)
    void QRCode.toDataURL(publicUrl, {
      width: 1080,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    })
      .then((value: string) => {
        if (!cancelled) {
          setQrDataUrl(value)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to generate QR code right now.')
          setQrDataUrl('')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingQr(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [building, open, publicUrl])

  async function renderCardToDataUrl() {
    if (!building || !publicUrl || !qrDataUrl) return ''

    const canvas = document.createElement('canvas')
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT
    const context = canvas.getContext('2d')
    if (!context) return ''

    const [qrImage, logoImage] = await Promise.all([loadImage(qrDataUrl), loadImage('/logo.png')])

    context.fillStyle = '#f8fafc'
    context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    context.fillStyle = '#111827'
    context.fillRect(56, 56, CARD_WIDTH - 112, CARD_HEIGHT - 112)

    context.fillStyle = '#ffffff'
    context.fillRect(86, 86, CARD_WIDTH - 172, CARD_HEIGHT - 172)

    context.drawImage(logoImage, 420, 120, 360, 120)

    context.fillStyle = '#0f172a'
    context.font = '700 58px system-ui, -apple-system, Segoe UI, sans-serif'
    context.textAlign = 'center'
    context.fillText(building.name, CARD_WIDTH / 2, 340)

    context.fillStyle = '#475569'
    context.font = '400 34px system-ui, -apple-system, Segoe UI, sans-serif'
    context.fillText('Scan to open this building guide', CARD_WIDTH / 2, 400)

    context.fillStyle = '#f1f5f9'
    context.fillRect(210, 450, 780, 780)
    context.drawImage(qrImage, 250, 490, 700, 700)

    context.fillStyle = '#e2e8f0'
    context.fillRect(120, 1290, CARD_WIDTH - 240, 180)
    context.fillStyle = '#64748b'
    context.font = '600 30px system-ui, -apple-system, Segoe UI, sans-serif'
    context.fillText('WOW living', CARD_WIDTH / 2, 1390)

    return canvas.toDataURL('image/png')
  }

  async function handleDownloadPng() {
    if (!building || !qrDataUrl || exporting) return
    setExporting(true)
    setError(null)

    try {
      const cardDataUrl = await renderCardToDataUrl()
      if (!cardDataUrl) {
        throw new Error('Could not render PNG')
      }
      const anchor = document.createElement('a')
      anchor.href = cardDataUrl
      anchor.download = `${building.id}-qr-card.png`
      anchor.click()
    } catch {
      setError('Unable to download PNG right now.')
    } finally {
      setExporting(false)
    }
  }

  async function handlePrintCard() {
    if (!building || !qrDataUrl || exporting) return
    setExporting(true)
    setError(null)

    const printWindow = window.open('', '_blank', 'width=900,height=1200')
    if (!printWindow) {
      setExporting(false)
      setError('Unable to open print view. Please allow pop-ups for this site.')
      return
    }

    printWindow.document.write(
      `<!doctype html>
        <html>
          <head>
            <title>Preparing print...</title>
            <style>
              body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #334155; background: #f8fafc; }
            </style>
          </head>
          <body>Preparing branded QR card...</body>
        </html>`
    )
    printWindow.document.close()

    try {
      const cardDataUrl = await renderCardToDataUrl()
      if (!cardDataUrl) {
        throw new Error('Could not render print preview')
      }
      printWindow.document.write(
        `<!doctype html>
          <html>
            <head>
              <title>${building.name} QR Card</title>
              <style>
                html, body { margin: 0; padding: 0; }
                body { background: #e2e8f0; display: grid; place-items: center; min-height: 100vh; }
                img { width: min(90vw, 700px); height: auto; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25); }
                @media print {
                  @page { size: auto; margin: 0; }
                  html, body { width: 100%; height: 100%; }
                  body { background: #fff; min-height: 0; overflow: hidden; }
                  img {
                    width: auto;
                    max-width: 100%;
                    height: auto;
                    max-height: 100vh;
                    display: block;
                    margin: 0 auto;
                    box-shadow: none;
                    break-inside: avoid;
                    page-break-inside: avoid;
                  }
                }
              </style>
            </head>
            <body>
              <img src="${cardDataUrl}" alt="${building.name} QR card" />
              <script>
                window.addEventListener('load', function () {
                  setTimeout(function () {
                    window.print();
                  }, 120);
                });
              </script>
            </body>
          </html>`
      )
      printWindow.document.close()
    } catch {
      printWindow.close()
      setError('Unable to open print view right now.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Branded QR Card
          </DialogTitle>
          <DialogDescription>
            {building
              ? `Generate a branded QR for ${building.name}.`
              : 'Generate a branded QR card for a building.'}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="relative mx-auto h-8 w-24">
              <Image src="/logo.png" alt="WOW Guide logo" fill sizes="96px" className="object-contain" />
            </div>
            <p className="mt-4 text-center text-lg font-semibold text-slate-900">{building?.name ?? 'Building'}</p>
            <p className="text-center text-sm text-slate-500">Scan to open the building guide</p>
            <div className="mt-4 grid place-items-center rounded-lg bg-slate-100 p-4">
              {loadingQr ? (
                <div className="flex h-[230px] items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                </div>
              ) : qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt={`${building?.name ?? 'Building'} QR code`}
                  width={230}
                  height={230}
                  unoptimized
                  className="rounded-md bg-white p-2"
                />
              ) : (
                <p className="py-20 text-sm text-slate-500">QR preview unavailable.</p>
              )}
            </div>
            <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-center text-xs text-slate-700">
              Point your phone camera at the code
            </p>
          </div>
        </div>

        {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={handlePrintCard} disabled={loadingQr || !qrDataUrl || exporting}>
            <Printer className="mr-2 h-4 w-4" />
            Print Card
          </Button>
          <Button onClick={handleDownloadPng} disabled={loadingQr || !qrDataUrl || exporting}>
            <Download className="mr-2 h-4 w-4" />
            Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
