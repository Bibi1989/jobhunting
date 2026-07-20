/**
 * Live export smoke test against the running Nuxt app.
 * Usage: node scripts/test-live-export.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const outDir = join(process.cwd(), '.data', 'pdf-qa')
mkdirSync(outDir, { recursive: true })

const base = process.env.APP_URL || 'http://localhost:3000'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })

page.on('dialog', async (dialog) => {
  console.error('UNEXPECTED_DIALOG', dialog.type(), dialog.message())
  await dialog.dismiss()
  process.exitCode = 2
})

const errors = []
page.on('pageerror', (err) => errors.push(String(err)))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})

await page.goto(`${base}/builder/resume/new`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForSelector('.preview-content', { timeout: 30000 })
await page.waitForTimeout(800)

const downloadPromise = page.waitForEvent('download', { timeout: 45000 }).catch(() => null)
await page.getByRole('button', { name: /Export PDF/i }).click()

const download = await downloadPromise
const toastText = await page.locator('[role="status"]').first().textContent().catch(() => '')

if (download) {
  const target = join(outDir, 'live-export-resume.pdf')
  await download.saveAs(target)
  console.log(JSON.stringify({ ok: true, file: target, toastText, errors }, null, 2))
} else {
  await page.screenshot({ path: join(outDir, 'live-export-fail.png'), fullPage: true })
  console.log(JSON.stringify({ ok: false, toastText, errors }, null, 2))
  process.exitCode = 1
}

await browser.close()
