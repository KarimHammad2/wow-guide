import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

/** Removes near-black (logo plate / background) so white WOW sits on transparent. */
const OUT = path.resolve(process.cwd(), 'public/wow-logo-white.png')

const BLACK_T0 = 18
const BLACK_T1 = 70

function alphaFromNearBlack(r, g, b) {
  const m = Math.max(r, g, b)
  if (m <= BLACK_T0) return 0
  if (m >= BLACK_T1) return 255
  return Math.round(((m - BLACK_T0) / (BLACK_T1 - BLACK_T0)) * 255)
}

async function main() {
  const srcArg = process.argv[2]
  const SRC = srcArg
    ? path.resolve(process.cwd(), srcArg)
    : OUT

  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = alphaFromNearBlack(r, g, b)
    data[i + 3] = Math.min(data[i + 3], a)
  }

  const outPng = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .png()
    .toBuffer()

  const tmp = `${OUT}.tmp`
  await fs.writeFile(tmp, outPng)
  await fs.rename(tmp, OUT)
  console.log('Wrote', OUT)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
