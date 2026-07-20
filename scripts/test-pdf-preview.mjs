/**
 * Visual QA: screenshot preview, capture with html2canvas+jsPDF (same stack as app), screenshot PDF.
 * Run: node scripts/test-pdf-preview.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const html2canvasPath = require.resolve('html2canvas/dist/html2canvas.min.js')
const jspdfPath = require.resolve('jspdf/dist/jspdf.umd.min.js')

const outDir = join(process.cwd(), '.data', 'pdf-qa')
mkdirSync(outDir, { recursive: true })

const previewCss = readFileSync(join(process.cwd(), 'assets/css/document-preview.css'), 'utf8')

function paperShell(bodyInner) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; background: #334155; font-family: Georgia, 'Times New Roman', serif; }
    ${previewCss}
    .preview-content {
      width: 210mm;
      min-height: 297mm;
      margin: 24px auto;
      padding: 48px;
      box-sizing: border-box;
      background: #fff;
      color: #0f172a;
    }
    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.25rem;
      margin: 1.5rem 0 1rem;
    }
    .row { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; }
    .title { font-weight: 700; }
    .meta { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; white-space: nowrap; }
    .company { font-style: italic; font-size: 0.875rem; color: #334155; }
    .loc { font-size: 0.75rem; color: #64748b; white-space: nowrap; }
    .cover-letter-body p { margin: 0 0 0.75rem; }
  </style>
</head>
<body>
  <div id="paper" class="preview-content">
    <header style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:1.5rem;margin-bottom:2rem;">
      <h1 style="font-size:2rem;margin:0;text-transform:uppercase;">Jonathan R. Sterling</h1>
      <h2 style="font-size:1rem;color:#475569;text-transform:uppercase;letter-spacing:0.08em;margin:0.35rem 0 0.75rem;">Senior Fullstack Engineer</h2>
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.12em;color:#475569;">
        San Francisco, CA | jonathan.sterling@email.com | 415.555.0198
      </div>
    </header>
    ${bodyInner}
  </div>
</body>
</html>`
}

const resumeBody = `
  <h2 class="section-title">Experience</h2>
  <div>
    <div class="row">
      <div class="title">Senior Fullstack Engineer</div>
      <div class="meta">Jan 2026, Present</div>
    </div>
    <div class="row" style="margin-bottom:0.5rem;">
      <div class="company">Innovate Tech Solutions</div>
      <div class="loc">San Francisco, CA</div>
    </div>
    <div class="rich-text-content">
      <ul>
        <li>Led end-to-end delivery of customer-facing web platforms using React, Node.js, and cloud infrastructure.</li>
        <li>Improved release reliability with automated tests and CI/CD, cutting production incidents over successive quarters.</li>
        <li>Mentored engineers and partnered with product to ship scoped features on a predictable cadence.</li>
      </ul>
    </div>
  </div>
  <h2 class="section-title">Education</h2>
  <div>
    <div class="row">
      <div class="title">B.S. Computer Science</div>
      <div class="meta">Jun 2019</div>
    </div>
    <div class="row">
      <div class="company" style="font-style:normal;">State University</div>
      <div class="loc">California, USA</div>
    </div>
  </div>
`

const coverBody = `
  <div style="margin-bottom:2rem;font-size:0.875rem;font-family:system-ui,sans-serif;">
    <p>July 17, 2026</p>
    <br />
    <p style="font-weight:700;margin:0;">Hiring Manager</p>
    <p style="margin:0;">Innovate Tech Solutions</p>
  </div>
  <div class="rich-text-content cover-letter-body" style="font-size:15px;line-height:1.55;">
    <p>Dear Hiring Manager,</p>
    <p>I am writing to apply for the Senior Fullstack Engineer role at Innovate Tech Solutions. My recent work delivering React and Node.js platforms maps directly to the needs in your posting.</p>
    <p>In my current role I improved release reliability with automated tests and CI/CD, and I partner closely with product to ship scoped features on a predictable cadence.</p>
    <p>I would welcome a conversation about how I can contribute to your team.</p>
    <p>Sincerely,</p>
    <p>Jonathan R. Sterling</p>
  </div>
`

async function capturePair(label, html, ids) {
  const htmlPath = join(outDir, `${label}-fixture.html`)
  writeFileSync(htmlPath, html)

  const page = await browser.newPage({ viewport: { width: 1100, height: 1600 } })
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' })
  await page.addScriptTag({ path: html2canvasPath })
  await page.addScriptTag({ path: jspdfPath })

  await page.locator('#paper').screenshot({ path: join(outDir, ids.preview) })

  const result = await page.evaluate(async () => {
    const element = document.getElementById('paper')
    const canvas = await window.html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })
    const imgData = canvas.toDataURL('image/png')
    const { jsPDF } = window.jspdf
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * pageWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    while (heightLeft > 1) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    return {
      previewPng: imgData,
      pdfBase64: pdf.output('datauristring').split(',')[1],
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    }
  })

  writeFileSync(
    join(outDir, ids.canvas),
    Buffer.from(result.previewPng.replace(/^data:image\/png;base64,/, ''), 'base64'),
  )
  writeFileSync(join(outDir, ids.pdf), Buffer.from(result.pdfBase64, 'base64'))
  await page.close()
  return result
}

const browser = await chromium.launch({ headless: true })

const resume = await capturePair('resume', paperShell(resumeBody), {
  preview: '01-preview.png',
  canvas: '02-canvas-capture.png',
  pdf: '03-export.pdf',
  pdfShot: '04-pdf-screenshot.png',
})

const cover = await capturePair('cover', paperShell(coverBody), {
  preview: '05-cover-preview.png',
  canvas: '06-cover-canvas.png',
  pdf: '07-cover-export.pdf',
  pdfShot: '08-cover-pdf-screenshot.png',
})

await browser.close()

import { execSync } from 'node:child_process'
for (const pdf of ['03-export.pdf', '07-cover-export.pdf']) {
  execSync(`qlmanage -t -s 1400 -o "${outDir}" "${join(outDir, pdf)}"`, {
    stdio: 'ignore',
  })
}

console.log(
  JSON.stringify(
    {
      outDir,
      resumeCanvas: { w: resume.canvasWidth, h: resume.canvasHeight },
      coverCanvas: { w: cover.canvasWidth, h: cover.canvasHeight },
      files: [
        '01-preview.png',
        '02-canvas-capture.png',
        '03-export.pdf',
        '03-export.pdf.png',
        '05-cover-preview.png',
        '06-cover-canvas.png',
        '07-cover-export.pdf',
        '07-cover-export.pdf.png',
      ],
    },
    null,
    2,
  ),
)
