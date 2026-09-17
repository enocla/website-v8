// Build-time: render static OG images to public/og/.
//
// Runs in plain Node before `vite build`, so native/wasm dependencies load
// normally with no bundler workarounds. The images only change when page
// titles change. Run with: node scripts/generate-og.mjs
import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import { decompress } from 'wawoff2'
import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const WIDTH = 1200
const HEIGHT = 630

const BG = '#f1f0e8'
const INK = '#1c1613'
const SECONDARY = '#5e5956'
const ACCENT = '#01567e'
const BORDER = 'rgba(94, 89, 86, 0.52)'

const PAGES = [
  { file: 'about-me.png', title: 'about me' },
  { file: 'about.png', title: 'about' },
  { file: 'projects.png', title: 'projects' },
  { file: 'writing.png', title: 'writing' },
  { file: 'history.png', title: 'writing - The History of this Site' },
]

async function loadWoff2(relativePath) {
  const raw = await fs.promises.readFile(path.join(root, relativePath))
  const ttf = await decompress(new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength))
  const bytes = new Uint8Array(ttf)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

function titleFontSize(title) {
  if (title.length > 80) return 56
  if (title.length > 40) return 72
  return 92
}

const el = React.createElement

function template(title) {
  return el(
    'div',
    {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: BG,
        padding: 36,
      },
    },
    el(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          border: `2px solid ${BORDER}`,
          padding: '56px 64px',
        },
      },
      el(
        'div',
        {
          style: {
            fontFamily: 'Maple Mono',
            fontSize: 30,
            letterSpacing: 2,
            color: SECONDARY,
          },
        },
        'enochlau.com',
      ),
      el(
        'div',
        {
          style: {
            fontFamily: 'Sentient',
            fontSize: titleFontSize(title),
            lineHeight: 1.08,
            color: INK,
          },
        },
        title,
      ),
      el('div', {
        style: {
          display: 'flex',
          width: 96,
          height: 8,
          backgroundColor: ACCENT,
        },
      }),
    ),
  )
}

const fonts = [
  { name: 'Sentient', file: 'assets/fonts/Sentient-400.subset.woff2', weight: 400 },
  { name: 'Sentient', file: 'assets/fonts/Sentient-500.subset.woff2', weight: 500 },
  { name: 'Sentient', file: 'assets/fonts/Sentient-700.subset.woff2', weight: 700 },
  { name: 'Maple Mono', file: 'public/fonts/MapleMono-Regular.woff2', weight: 400 },
]

const loaded = []
for (const font of fonts) {
  loaded.push({ ...font, data: await loadWoff2(font.file), style: 'normal' })
  delete loaded[loaded.length - 1].file
}

await fs.promises.mkdir(path.join(root, 'public/og'), { recursive: true })

for (const page of PAGES) {
  const svg = await satori(template(page.title), {
    width: WIDTH,
    height: HEIGHT,
    fonts: loaded,
  })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng()
  const dest = path.join(root, 'public/og', page.file)
  await fs.promises.writeFile(dest, png)
  console.log(`[og] ${page.title} -> public/og/${page.file} (${png.length} bytes)`)
}
