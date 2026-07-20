/**
 * Multi-page PDF smoke: inject tall content, export, compare page 1 preview sheet vs PDF page 1.
 * Usage: node scripts/smoke-preview-vs-pdf.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const outDir = join(process.cwd(), '.data', 'pdf-qa')
mkdirSync(outDir, { recursive: true })

const base = process.env.APP_URL || 'http://localhost:3000'
const template = process.env.TEMPLATE || 'the-creative-director'

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })

const errors = []
page.on('pageerror', (err) => errors.push(String(err)))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})

await page.goto(`${base}/builder/resume/new?template=${encodeURIComponent(template)}`, {
  waitUntil: 'networkidle',
  timeout: 90000,
})
await page.waitForSelector('[data-pdf-page]', { timeout: 45000 })
await page.waitForTimeout(1000)

const creativeCard = page.locator('text=Creative Director').first()
if (await creativeCard.count()) {
  await creativeCard.click().catch(() => {})
  await page.waitForTimeout(800)
}

const injected = await page.evaluate(() => {
  const root =
    document.querySelector('.theme-creative-director .flex-1') ||
    document.querySelector('.preview-content')
  if (!root) return { ok: false }
  const holder = document.createElement('div')
  holder.setAttribute('data-smoke-inject', '1')
  for (let i = 0; i < 8; i++) {
    const block = document.createElement('div')
    block.className = 'pdf-avoid-break relative pl-4 border-l border-teal-200/60 mb-5'
    block.innerHTML = `
      <h4 class="font-bold text-[11.5px] text-slate-800">Senior Engineer Role ${i + 1}</h4>
      <p class="text-[#006a61] font-semibold text-[9.5px] mb-1.5">Example Corp ${i + 1} | Hamburg</p>
      <ul class="text-[10px] text-slate-600 space-y-1">
        <li>Led delivery of platforms using React, Node.js, and cloud infrastructure across product squads.</li>
        <li>Improved release reliability with automated tests and CI/CD over successive quarters.</li>
        <li>Mentored engineers and partnered with product to ship scoped features on a predictable cadence.</li>
      </ul>`
    holder.appendChild(block)
  }
  root.appendChild(holder)
  return { ok: true, height: root.scrollHeight }
})

await page.waitForTimeout(600)
// Trigger remasure by a tiny resize nudge
await page.evaluate(() => window.dispatchEvent(new Event('resize')))
await page.waitForTimeout(800)

const sheetCount = await page.locator('[data-pdf-page]').count()
console.log('preview_sheets', sheetCount, 'injected', injected)

// Screenshot page-1 sheet (strip shadow for fair compare)
await page.locator('[data-pdf-page="1"]').evaluate((el) => {
  el.style.boxShadow = 'none'
  el.style.borderRadius = '0'
})
await page.locator('[data-pdf-page="1"]').screenshot({
  path: join(outDir, 'smoke-preview-page-1.png'),
})

const downloadPromise = page.waitForEvent('download', { timeout: 180000 }).catch(() => null)
await page.getByRole('button', { name: /Export PDF/i }).click()
const download = await downloadPromise

if (!download) {
  console.log(JSON.stringify({ ok: false, reason: 'no-download', errors }, null, 2))
  await browser.close()
  process.exit(1)
}

const pdfPath = join(outDir, 'smoke-export.pdf')
await download.saveAs(pdfPath)

const pdfParse = require('pdf-parse')
const parsed = await pdfParse(readFileSync(pdfPath))
const pdfPageCount = parsed.numpages || 0

execSync(`magick -density 144 "${pdfPath}" -quality 90 "${join(outDir, 'smoke-pdf-%d.png')}"`, {
  stdio: 'ignore',
})

const pdfPages = []
for (let i = 0; i < 12; i++) {
  const p = join(outDir, `smoke-pdf-${i}.png`)
  if (existsSync(p)) pdfPages.push(p)
}
if (pdfPages[0]) writeFileSync(join(outDir, 'smoke-pdf-page-1.png'), readFileSync(pdfPages[0]))
if (pdfPages[1]) writeFileSync(join(outDir, 'smoke-pdf-page-2.png'), readFileSync(pdfPages[1]))

let compare = null
if (pdfPages[0] && existsSync(join(outDir, 'smoke-preview-page-1.png'))) {
  compare = await page.evaluate(async ({ a, b }) => {
    function load(src) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    }
    const ia = await load(a)
    const ib = await load(b)
    const w = 420
    const h = 594
    const c1 = document.createElement('canvas')
    const c2 = document.createElement('canvas')
    c1.width = c2.width = w
    c1.height = c2.height = h
    const x1 = c1.getContext('2d')
    const x2 = c2.getContext('2d')
    x1.fillStyle = x2.fillStyle = '#fff'
    x1.fillRect(0, 0, w, h)
    x2.fillRect(0, 0, w, h)
    const fit = (ctx, img) => {
      const s = Math.max(w / img.width, h / img.height)
      const dw = img.width * s
      const dh = img.height * s
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
    }
    fit(x1, ia)
    fit(x2, ib)
    const d1 = x1.getImageData(0, 0, w, h).data
    const d2 = x2.getImageData(0, 0, w, h).data
    let sum = 0
    let diffs = 0
    for (let i = 0; i < d1.length; i += 4) {
      const m = (Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2])) / 3
      sum += m
      if (m > 30) diffs++
    }
    return {
      mae: Number((sum / (w * h)).toFixed(2)),
      pctDiffPixels: Number(((diffs / (w * h)) * 100).toFixed(2)),
    }
  }, {
    a: `data:image/png;base64,${readFileSync(join(outDir, 'smoke-preview-page-1.png')).toString('base64')}`,
    b: `data:image/png;base64,${readFileSync(pdfPages[0]).toString('base64')}`,
  })
}

const ok =
  pdfPageCount >= 2
  && sheetCount >= 2
  && !!compare
  && compare.mae < 16
  && compare.pctDiffPixels < 14
  && errors.length === 0

const report = {
  ok,
  template,
  sheetCount,
  pdfPageCount,
  compare,
  injected,
  errors: errors.slice(0, 15),
}
writeFileSync(join(outDir, 'smoke-report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
await browser.close()
process.exit(ok ? 0 : 2)
