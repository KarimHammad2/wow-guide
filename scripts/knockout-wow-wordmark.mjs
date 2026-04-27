/**
 * Chroma-knockout for mauve-on-black source → transparent PNG in public/
 * Run: node scripts/knockout-wow-wordmark.mjs
 */
import sharp from 'sharp'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const input = join(root, 'branding', 'wow-perspective-source.png')
const out = join(root, 'public', 'wow-wordmark.png')

if (!existsSync(input)) {
  console.error('Missing source:', input)
  process.exit(1)
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info
if (channels !== 4) {
  console.error('Expected RGBA')
  process.exit(1)
}

// Treat near-black as transparent; keep mauve / anti-alias as semi-opaque for smooth edges
for (let i = 0; i < data.length; i += 4) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  // Strong black background
  if (lum < 18 && r < 22 && g < 22 && b < 22) {
    data[i + 3] = 0
    continue
  }
  // Dark fringe between black and logo (AA): fade alpha
  if (lum < 55 && r < 50 && g < 45 && b < 50) {
    const t = Math.max(0, Math.min(1, (lum - 12) / 40))
    data[i + 3] = Math.round(255 * t)
  } else {
    data[i + 3] = 255
  }
}

await sharp(data, { raw: { width, height, channels: 4 } })
  .png()
  .toFile(out)

console.log('Wrote', out, `${width}×${height}`)
