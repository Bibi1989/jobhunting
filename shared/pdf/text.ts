export interface PdfTextBlock {
  type: 'paragraph' | 'bullet'
  text: string
}

export function stripHtmlToPlain(html?: string | null): string {
  if (!html) return ''
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/** Parse Quill/HTML descriptions into paragraphs + bullets for PDF Text nodes. */
export function htmlToBlocks(html?: string | null): PdfTextBlock[] {
  if (!html) return []
  const source = String(html)
  const blocks: PdfTextBlock[] = []

  const liMatches = [...source.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
  if (liMatches.length) {
    for (const match of liMatches) {
      const text = stripHtmlToPlain(match[1])
      if (text) blocks.push({ type: 'bullet', text })
    }
    if (blocks.length) return blocks
  }

  const paragraphs = stripHtmlToPlain(source)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•●▪◦]\s+/, '').trim())
    .filter(Boolean)

  for (const line of paragraphs) {
    blocks.push({
      type: /^[-*•]/.test(line) ? 'bullet' : 'paragraph',
      text: line.replace(/^[-*•]\s+/, ''),
    })
  }
  return blocks
}

export function formatDateRange(
  start?: string,
  end?: string,
  isCurrent?: boolean,
): string {
  const fmt = (value?: string) => {
    if (!value) return ''
    const d = new Date(`${value}-01`)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  const left = fmt(start)
  const right = isCurrent ? 'Present' : fmt(end)
  if (left && right) return `${left} – ${right}`
  return left || right || ''
}
