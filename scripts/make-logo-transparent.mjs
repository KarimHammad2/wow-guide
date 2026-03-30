import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC =
  'C:\\Users\\karim\\.cursor\\projects\\c-Users-karim-OneDrive-Desktop-wow-guide\\assets\\c__Users_karim_AppData_Roaming_Cursor_User_workspaceStorage_c7310eee9097268655b2a03375415736_images_93b9d88c-942b-4c46-bf23-5c19779d232e-f32549f9-aa1c-4ce9-9d97-b4f9287f0b31.png'

const OUT_DIR = path.resolve(process.cwd(), 'public')
const OUTPUTS = ['logo.png', 'favicon.png', 'apple-icon.png', 'placeholder-logo.png']

// Soft-key near-black to transparency.
// This preserves anti-aliased edges (dark pixels around the letters)
// by fading alpha rather than hard-cutting it.
const BLACK_T0 = 18
const BLACK_T1 = 70

function alphaFromNearBlack(r, g, b) {
  const m = Math.max(r, g, b) // "how not-black is this pixel"
  if (m <= BLACK_T0) return 0
  if (m >= BLACK_T1) return 255
  return Math.round(((m - BLACK_T0) / (BLACK_T1 - BLACK_T0)) * 255)
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // RGBA
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
    // Remove transparent border so the logo scales correctly
    .trim()
    .png()
    .toBuffer()

  await Promise.all(
    OUTPUTS.map((name) => fs.writeFile(path.join(OUT_DIR, name), outPng))
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

