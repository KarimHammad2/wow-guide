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

/** Mauve card + white QR (print-style artwork). */
const QR_CARD_BG = '#946376'
const QR_CARD_FG = '#ffffff'

const CARD_SIZE = 1200

function displayUrlFromAbsolute(absoluteUrl: string): string {
  try {
    const u = new URL(absoluteUrl)
    const host = u.hostname.toLowerCase()
    const path = u.pathname.replace(/\/+$/, '') || ''
    return `${host}${path}`
  } catch {
    return absoluteUrl.replace(/^https?:\/\//i, '').toLowerCase()
  }
}

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
    return toAbsoluteSiteUrl(`/${building.id}`)
  }, [building])

  const displayUrl = useMemo(
    () => (publicUrl ? displayUrlFromAbsolute(publicUrl) : ''),
    [publicUrl]
  )

  useEffect(() => {
    if (!open || !building || !publicUrl) return
    let cancelled = false

    setLoadingQr(true)
    setError(null)
    void QRCode.toDataURL(publicUrl, {
      width: 1080,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: QR_CARD_FG,
        light: QR_CARD_BG,
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
    canvas.width = CARD_SIZE
    canvas.height = CARD_SIZE
    const context = canvas.getContext('2d')
    if (!context) return ''

    const qrImage = await loadImage(qrDataUrl)
    const urlLine = displayUrlFromAbsolute(publicUrl)

    context.fillStyle = QR_CARD_BG
    context.fillRect(0, 0, CARD_SIZE, CARD_SIZE)

    const title = 'WOW GUIDE'
    const padX = 72
    const titleBaseline = 132
    const urlBaseline = CARD_SIZE - 96
    const qrSize = 700
    const midY = (titleBaseline + urlBaseline) / 2
    const qrX = CARD_SIZE / 2 - qrSize / 2
    const qrY = midY - qrSize / 2

    context.fillStyle = QR_CARD_FG
    context.textAlign = 'center'
    context.font = '700 52px Montserrat, system-ui, -apple-system, Segoe UI, sans-serif'
    context.fillText(title, CARD_SIZE / 2, titleBaseline)

    context.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

    const lowerUrl = urlLine.toLowerCase()
    const slashIdx = lowerUrl.indexOf('/')
    const maxUrlWidth = CARD_SIZE - padX * 2

    let urlFontPx = 30
    const drawUrl = (fontPx: number, lines: string[]) => {
      context.font = `400 ${fontPx}px Montserrat, system-ui, -apple-system, Segoe UI, sans-serif`
      const lineGap = Math.round(fontPx * 0.45)
      const totalH = lines.length * fontPx + (lines.length - 1) * lineGap
      let y = urlBaseline - (totalH - fontPx)
      for (const line of lines) {
        context.fillText(line, CARD_SIZE / 2, y)
        y += fontPx + lineGap
      }
    }

    const lines =
      slashIdx === -1
        ? [lowerUrl]
        : [lowerUrl.slice(0, slashIdx + 1), lowerUrl.slice(slashIdx + 1)].filter(Boolean)

    while (urlFontPx >= 22) {
      context.font = `400 ${urlFontPx}px Montserrat, system-ui, -apple-system, Segoe UI, sans-serif`
      const fits = lines.every((line) => context.measureText(line).width <= maxUrlWidth)
      if (fits) {
        drawUrl(urlFontPx, lines)
        break
      }
      urlFontPx -= 2
    }
    if (urlFontPx < 22) {
      context.font = '400 22px Montserrat, system-ui, -apple-system, Segoe UI, sans-serif'
      context.fillText(lowerUrl, CARD_SIZE / 2, urlBaseline)
    }

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
          <div
            className="flex aspect-square w-full max-w-sm flex-col items-center justify-between gap-4 rounded-xl px-5 py-7 shadow-sm mx-auto"
            style={{ backgroundColor: QR_CARD_BG }}
          >
            <p className="text-center font-sans text-sm font-bold uppercase tracking-wide text-white">WOW GUIDE</p>
            <div className="flex min-h-0 flex-1 items-center justify-center py-2">
              {loadingQr ? (
                <div className="flex h-48 w-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-white/80" />
                </div>
              ) : qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt={`${building?.name ?? 'Building'} QR code`}
                  width={220}
                  height={220}
                  unoptimized
                  className="h-auto max-h-[min(50vw,220px)] w-auto max-w-[85%]"
                />
              ) : (
                <p className="py-16 text-sm text-white/70">QR preview unavailable.</p>
              )}
            </div>
            <p className="max-w-full break-all text-center font-sans text-[11px] font-normal leading-snug text-white [font-variant-ligatures:none] lowercase">
              {displayUrl || '—'}
            </p>
          </div>
          {building ? (
            <p className="mt-3 text-center text-xs text-slate-500">{building.name}</p>
          ) : null}
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
