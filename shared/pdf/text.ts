export interface PdfTextBlock {
  type: 'paragraph' | 'bullet'
  text: string
  /** Inline HTML fragment (strong/em/u) for typography in PDF. */
  html?: string
}

export interface PdfInlineRun {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
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

function escapeHtmlText(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const INLINE_TAGS = new Set(['strong', 'b', 'em', 'i', 'u', 'br'])

/** Keep only bold / italic / underline / br. */
export function sanitizeInlineHtml(html?: string | null): string {
  if (!html) return ''
  let out = String(html)
    .replace(/\u00a0/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\s*b(\s[^>]*)?>/gi, '<strong>')
    .replace(/<\/\s*b\s*>/gi, '</strong>')
    .replace(/<\s*i(\s[^>]*)?>/gi, '<em>')
    .replace(/<\/\s*i\s*>/gi, '</em>')
    .replace(/<\s*br\s*\/?\s*>/gi, '<br>')

  out = out.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (full, tag: string) => {
    const name = tag.toLowerCase()
    if (!INLINE_TAGS.has(name)) return ''
    if (name === 'br') return '<br>'
    if (name === 'b') return full.startsWith('</') ? '</strong>' : '<strong>'
    if (name === 'i') return full.startsWith('</') ? '</em>' : '<em>'
    if (full.startsWith('</')) return `</${name}>`
    if (name === 'strong' || name === 'em' || name === 'u') return `<${name}>`
    return ''
  })

  return out
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Decode a few entities for PDF run text. */
function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

/** Parse inline HTML into styled runs for react-pdf Text. */
export function htmlToInlineRuns(html?: string | null): PdfInlineRun[] {
  const source = sanitizeInlineHtml(html)
  if (!source) return []

  const runs: PdfInlineRun[] = []
  const stack: Array<'bold' | 'italic' | 'underline'> = []
  const tokenRe = /<\/?(?:strong|em|u|br)\b[^>]*>|[^<]+/gi
  const tokens = source.match(tokenRe) || []

  for (const token of tokens) {
    const open = token.match(/^<(strong|em|u)\b/i)
    const close = token.match(/^<\/(strong|em|u)>/i)
    if (/^<br\b/i.test(token)) {
      runs.push({ text: ' ', bold: stack.includes('bold'), italic: stack.includes('italic'), underline: stack.includes('underline') })
      continue
    }
    if (open) {
      const tag = open[1]!.toLowerCase()
      stack.push(tag === 'strong' ? 'bold' : tag === 'em' ? 'italic' : 'underline')
      continue
    }
    if (close) {
      const tag = close[1]!.toLowerCase()
      const kind = tag === 'strong' ? 'bold' : tag === 'em' ? 'italic' : 'underline'
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i] === kind) {
          stack.splice(i, 1)
          break
        }
      }
      continue
    }
    const text = decodeEntities(token)
    if (!text) continue
    runs.push({
      text,
      bold: stack.includes('bold'),
      italic: stack.includes('italic'),
      underline: stack.includes('underline'),
    })
  }

  return runs.filter((r) => r.text.length)
}

/** Parse Quill/HTML descriptions into paragraphs + bullets for PDF Text nodes. */
export function htmlToBlocks(html?: string | null, forceParagraphs = false): PdfTextBlock[] {
  if (!html) return []
  const source = String(html)
  const blocks: PdfTextBlock[] = []

  const liMatches = [...source.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
  if (liMatches.length) {
    for (const match of liMatches) {
      const fragment = sanitizeInlineHtml(match[1])
      const text = stripHtmlToPlain(fragment)
        .replace(/\s*\n+\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (text) blocks.push({ type: 'bullet', text, html: fragment })
    }
    if (blocks.length) return blocks
  }

  const paragraphs = stripHtmlToPlain(source)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const asBullets = !forceParagraphs && paragraphs.length > 1
  for (const line of paragraphs) {
    const isBulletMarker = /^[-*•●▪◦]\s+/.test(line)
    const text = line.replace(/^[-*•●▪◦]\s+/, '').trim()
    blocks.push({
      type: asBullets || isBulletMarker ? 'bullet' : 'paragraph',
      text,
      html: escapeHtmlText(text),
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
  if (left && right) return `${left} - ${right}`
  return left || right || ''
}

/** Plain lines from HTML descriptions (formatting stripped). */
export function htmlToBulletText(html?: string | null): string {
  if (!html) return ''
  const source = String(html)
  const liMatches = [...source.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
  if (liMatches.length) {
    return liMatches
      .map((match) =>
        stripHtmlToPlain(match[1])
          .replace(/\s*\n+\s*/g, ' ')
          .replace(/^[-*•●▪◦]\s+/, '')
          .trim(),
      )
      .filter(Boolean)
      .join('\n')
  }

  return stripHtmlToPlain(source)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•●▪◦]\s+/, '').trim())
    .filter(Boolean)
    .join('\n')
}

/** Clean <ul><li> HTML from plain bullet lines. */
export function bulletTextToHtml(text?: string | null): string {
  const lines = String(text || '')
    .split(/\n/)
    .map((line) => line.replace(/^[-*•●▪◦]\s+/, '').trim())
    .filter(Boolean)
  if (!lines.length) return ''
  return `<ul>${lines.map((line) => `<li>${escapeHtmlText(line)}</li>`).join('')}</ul>`
}

/**
 * Normalize description HTML into <ul><li> while keeping bold/italic/underline.
 */
export function normalizeBulletListHtml(html?: string | null): string {
  if (!html) return ''
  let source = String(html).trim()
  source = source.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim()
  if (!source) return ''

  source = source.replace(/<span[^>]*class="[^"]*ql-ui[^"]*"[^>]*><\/span>/gi, '')
  source = source.replace(/<ol([^>]*)>([\s\S]*?)<\/ol>/gi, (_m, _a, inner: string) => {
    const hasBullet = /data-list\s*=\s*["']bullet["']/i.test(inner)
    const hasOrdered = /data-list\s*=\s*["']ordered["']/i.test(inner)
    if (hasBullet && !hasOrdered) {
      return `<ul>${inner
        .replace(/\sdata-list\s*=\s*["']bullet["']/gi, '')
        .replace(/\sclass\s*=\s*["'][^"']*["']/gi, '')}</ul>`
    }
    return `<ul>${inner}</ul>`
  })

  const liMatches = [...source.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
  if (liMatches.length) {
    const items = liMatches
      .map((m) => sanitizeInlineHtml(m[1]))
      .map((item) => item.replace(/^[-*•●▪◦]\s+/, '').trim())
      .filter(Boolean)
    if (!items.length) return ''
    return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
  }

  const chunks = source
    .split(/<\/(?:p|div|h[1-6])>|<br\s*\/?>/gi)
    .map((chunk) => sanitizeInlineHtml(chunk))
    .map((chunk) => chunk.replace(/^[-*•●▪◦]\s+/, '').trim())
    .filter(Boolean)

  if (!chunks.length) return bulletTextToHtml(htmlToBulletText(source))
  return `<ul>${chunks.map((item) => `<li>${item}</li>`).join('')}</ul>`
}

/** Normalize any description HTML before PDF layout (preserves typography). */
export function cleanDescriptionHtml(html?: string | null): string {
  if (!html) return ''
  return normalizeBulletListHtml(html)
}
