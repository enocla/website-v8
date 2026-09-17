// Regenerate the derived font files actually used by the repo:
//
// - assets/fonts/Sentient-{400,500,700}.subset.woff2 (OG image inputs,
//   consumed by scripts/generate-og.mjs)
// - public/fonts/Sentient-variable.subset.woff2 (site @font-face)
//
// Full TTFs are fetched from the Fontshare CDN into a temp dir (URLs below;
// if they rot, re-discover them via https://api.fontshare.com/v2/fonts),
// subsetted, and only the derived files are kept. Run with:
// node scripts/fetch-fonts.mjs
import subsetFont from 'subset-font'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const CDN = 'https://cdn.fontshare.com/wf'
const SOURCES = {
  'Sentient-variable.ttf':
    `${CDN}/NY2ZL3ZVCWEGOL6C3UVCNGYW5UU4EWVZ/E62VQS3OCYTBL5HEKIEGN3RTBX7KFK6F/NZPIPWPM74OTNMX6CKNACLBKCGJLJEBU.ttf`,
  'Sentient-400.ttf':
    `${CDN}/RVTZPYAA57KV4AMXRX7ZIPJXSTYCRP7A/36OUS5CBIXRKI2QU7G7OUHOK7HHA53Y2/SIH66VPT4WS2HIF5PEJNDU4INNUF54LG.ttf`,
  'Sentient-500.ttf':
    `${CDN}/XVVLA67EPQTZD7YHR3MQPW2IQXXDTGPX/IHGNDJMSP2Y53DG23KZTPBH753PUEUB2/RNUZPHMIVMPXFHVACRGCAJ32E6WUEDVU.ttf`,
  'Sentient-700.ttf':
    `${CDN}/XC4UYXMVQINJJ47RSKB74CCAWSP5BUGZ/TGOWV4725NO3KHVKMWHG47SRPLMNHMOO/433XP6QWDVL6KQ5K7ZCOP524TX4LE4RJ.ttf`,
}

// Broad coverage for titles and site copy: Basic Latin, Latin-1, Latin
// Extended A/B, general punctuation, currency, arrows, misc symbols (✦).
function corpusFor(ranges) {
  let s = ''
  for (const [from, to] of ranges) {
    for (let cp = from; cp <= to; cp++) {
      if (cp >= 0xd800 && cp <= 0xdfff) continue
      s += String.fromCodePoint(cp)
    }
  }
  return s
}

const corpus = corpusFor([
  [0x20, 0x7e],
  [0xa0, 0xff],
  [0x100, 0x24f],
  [0x2000, 0x206f],
  [0x20a0, 0x20cf],
  [0x2190, 0x21ff],
  [0x2600, 0x26ff],
])

const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'fonts-'))

async function fetchSource(name) {
  const res = await fetch(SOURCES[name])
  if (!res.ok) throw new Error(`download failed for ${name}: ${res.status}`)
  const dest = path.join(tmp, name)
  await fs.promises.writeFile(dest, Buffer.from(await res.arrayBuffer()))
  return dest
}

async function subsetToDest(src, dest) {
  const ttf = await fs.promises.readFile(src)
  const subset = await subsetFont(ttf, corpus, { targetFormat: 'woff2' })
  await fs.promises.writeFile(dest, Buffer.from(subset))
  console.log(`${path.basename(dest)}: ttf ${ttf.length} -> subset woff2 ${subset.length}`)
}

for (const weight of [400, 500, 700]) {
  const src = await fetchSource(`Sentient-${weight}.ttf`)
  await subsetToDest(
    src,
    path.join(root, 'assets/fonts', `Sentient-${weight}.subset.woff2`),
  )
}

await subsetToDest(
  await fetchSource('Sentient-variable.ttf'),
  path.join(root, 'public/fonts', 'Sentient-variable.subset.woff2'),
)

await fs.promises.rm(tmp, { recursive: true, force: true })
