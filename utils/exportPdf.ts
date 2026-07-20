import { jsPDF } from 'jspdf'
import { slugifyFilename } from './download'

type DocKind = 'resume' | 'coverLetter'

interface PdfTheme {
  marginX: number
  marginY: number
  pageWidth: number
  pageHeight: number
  contentWidth: number
  ink: [number, number, number]
  muted: [number, number, number]
  rule: [number, number, number]
}

export async function downloadProfessionalPdf(
  markdown: string,
  kind: DocKind,
  filenameBase: string,
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  })

  const theme: PdfTheme = {
    marginX: 54,
    marginY: 54,
    pageWidth: doc.internal.pageSize.getWidth(),
    pageHeight: doc.internal.pageSize.getHeight(),
    contentWidth: doc.internal.pageSize.getWidth() - 108,
    ink: [28, 28, 28],
    muted: [90, 90, 90],
    rule: [180, 180, 180],
  }

  let y = theme.marginY
  const lines = markdown.replace(/\r/g, '').split('\n')

  const ensureSpace = (needed: number) => {
    if (y + needed <= theme.pageHeight - theme.marginY) return
    doc.addPage()
    y = theme.marginY
  }

  const drawRule = () => {
    ensureSpace(14)
    doc.setDrawColor(...theme.rule)
    doc.setLineWidth(0.6)
    doc.line(theme.marginX, y, theme.marginX + theme.contentWidth, y)
    y += 14
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trimEnd()

    if (!line.trim()) {
      y += 8
      continue
    }

    if (line.startsWith('# ')) {
      ensureSpace(40)
      doc.setFont('times', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(...theme.ink)
      doc.text(stripMd(line.slice(2)), theme.marginX, y)
      y += 18
      // Next non-empty line often is subtitle / contact
      continue
    }

    if (line.startsWith('## ')) {
      y += 6
      ensureSpace(28)
      doc.setFont('times', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...theme.ink)
      doc.text(stripMd(line.slice(3)).toUpperCase(), theme.marginX, y)
      y += 6
      drawRule()
      continue
    }

    if (line.startsWith('### ')) {
      ensureSpace(24)
      doc.setFont('times', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...theme.ink)
      doc.text(stripMd(line.slice(4)), theme.marginX, y)
      y += 14
      continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const bullet = `•  ${stripMd(line.slice(2))}`
      doc.setFont('times', 'normal')
      doc.setFontSize(10.5)
      doc.setTextColor(...theme.ink)
      const wrapped = doc.splitTextToSize(bullet, theme.contentWidth - 10)
      ensureSpace(wrapped.length * 13 + 4)
      doc.text(wrapped, theme.marginX + 8, y)
      y += wrapped.length * 13 + 2
      continue
    }

    if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      doc.setFont('times', 'italic')
      doc.setFontSize(10)
      doc.setTextColor(...theme.muted)
      const wrapped = doc.splitTextToSize(stripMd(line), theme.contentWidth)
      ensureSpace(wrapped.length * 12 + 4)
      doc.text(wrapped, theme.marginX, y)
      y += wrapped.length * 12 + 4
      continue
    }

    // Body / contact / letter paragraphs
    const isContactLike =
      i <= 4 &&
      (line.includes('@') || line.includes('·') || line.includes('linkedin') || line.includes('http'))

    if (isContactLike || (i === 1 && !line.startsWith('#'))) {
      doc.setFont('times', isContactLike ? 'normal' : 'bold')
      doc.setFontSize(isContactLike ? 9.5 : 11)
      doc.setTextColor(...(isContactLike ? theme.muted : theme.ink))
      const wrapped = doc.splitTextToSize(stripMd(line), theme.contentWidth)
      ensureSpace(wrapped.length * 12 + 4)
      doc.text(wrapped, theme.marginX, y)
      y += wrapped.length * 12 + (isContactLike ? 10 : 6)
      if (isContactLike) drawRule()
      continue
    }

    doc.setFont('times', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(...theme.ink)
    const wrapped = doc.splitTextToSize(stripMd(line), theme.contentWidth)
    ensureSpace(wrapped.length * 13 + 6)
    doc.text(wrapped, theme.marginX, y)
    y += wrapped.length * 13 + 6
  }

  const suffix = kind === 'resume' ? 'resume' : 'cover-letter'
  doc.save(`${slugifyFilename(filenameBase)}-${suffix}.pdf`)
}

function stripMd(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim()
}
