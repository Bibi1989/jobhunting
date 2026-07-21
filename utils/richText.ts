/** Escape plain text for safe insertion into HTML. */
export function escapeHtmlText(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const INLINE_TAGS = new Set(['strong', 'b', 'em', 'i', 'u', 'br'])

/** Keep only bold / italic / underline / br inside a bullet. */
export function sanitizeInlineHtml(html?: string | null): string {
  if (!html) return ''
  let out = String(html)
    .replace(/\u00a0/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, '')

  // Normalize common wrappers Quill / browsers emit
  out = out
    .replace(/<\s*b(\s[^>]*)?>/gi, '<strong>')
    .replace(/<\/\s*b\s*>/gi, '</strong>')
    .replace(/<\s*i(\s[^>]*)?>/gi, '<em>')
    .replace(/<\/\s*i\s*>/gi, '</em>')
    .replace(/<\s*br\s*\/?\s*>/gi, '<br>')

  // Drop every tag except allowed inline ones (strip attributes too)
  out = out.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (full, tag: string) => {
    const name = tag.toLowerCase()
    if (!INLINE_TAGS.has(name)) return ''
    if (name === 'br') return '<br>'
    if (name === 'b') return full.startsWith('</') ? '</strong>' : '<strong>'
    if (name === 'i') return full.startsWith('</') ? '</em>' : '<em>'
    if (full.startsWith('</')) return `</${name === 'strong' || name === 'em' || name === 'u' ? name : name}>`
    if (name === 'strong' || name === 'em' || name === 'u') return `<${name}>`
    return ''
  })

  return out
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Convert stored HTML into plain lines (formatting stripped).
 * Kept for AI normalize / plain fallbacks.
 */
export function htmlToBulletText(html?: string | null): string {
  if (!html) return ''
  const source = String(html)
  const liMatches = [...source.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
  if (liMatches.length) {
    return liMatches
      .map((match) =>
        String(match[1] || '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&quot;/gi, '"')
          .replace(/&#39;/gi, "'")
          .replace(/\s+/g, ' ')
          .replace(/^[-*•●▪◦]\s+/, '')
          .trim(),
      )
      .filter(Boolean)
      .join('\n')
  }

  return source
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•●▪◦]\s+/, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

/** Convert plain bullet lines into clean <ul><li> HTML (no inline formatting). */
export function bulletTextToHtml(text?: string | null): string {
  const lines = String(text || '')
    .split(/\n/)
    .map((line) => line.replace(/^[-*•●▪◦]\s+/, '').trim())
    .filter(Boolean)
  if (!lines.length) return ''
  return `<ul>${lines.map((line) => `<li>${escapeHtmlText(line)}</li>`).join('')}</ul>`
}

/**
 * Normalize any description HTML into a clean <ul><li> list while keeping
 * bold / italic / underline inside each bullet.
 */
export function normalizeBulletListHtml(html?: string | null): string {
  if (!html) return ''
  let source = String(html).trim()
  source = source.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim()
  if (!source) return ''

  // Quill chrome
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

  // Paragraph / plain → bullets, preserve inline tags per block
  const chunks = source
    .split(/<\/(?:p|div|h[1-6])>|<br\s*\/?>/gi)
    .map((chunk) => sanitizeInlineHtml(chunk.replace(/<[^>]+>/g, (tag) => (/^<\/?(?:strong|em|u|b|i)\b/i.test(tag) ? tag : ''))))
    .map((chunk) => chunk.replace(/^[-*•●▪◦]\s+/, '').trim())
    .filter(Boolean)

  if (!chunks.length) {
    const plain = htmlToBulletText(source)
    return bulletTextToHtml(plain)
  }
  return `<ul>${chunks.map((item) => `<li>${item}</li>`).join('')}</ul>`
}

/**
 * Normalize Quill HTML so preview + PDF render full-width bullets like a normal document.
 */
export function sanitizeRichTextHtml(html?: string | null): string {
  if (!html) return ''
  let out = html
    .replace(/\u00a0/g, ' ')
    .replace(/—/g, ', ')
    .replace(/–/g, ', ')

  // Drop Quill UI chrome
  out = out.replace(/<span[^>]*class="[^"]*ql-ui[^"]*"[^>]*><\/span>/gi, '')

  // Convert Quill bullet <ol> lists to real <ul> when every item is a bullet
  out = out.replace(/<ol([^>]*)>([\s\S]*?)<\/ol>/gi, (_match, attrs: string, inner: string) => {
    const hasBullet = /data-list\s*=\s*["']bullet["']/i.test(inner)
    const hasOrdered = /data-list\s*=\s*["']ordered["']/i.test(inner)
    if (hasBullet && !hasOrdered) {
      const cleaned = inner
        .replace(/\sdata-list\s*=\s*["']bullet["']/gi, '')
        .replace(/\sclass\s*=\s*["'][^"']*["']/gi, '')
      return `<ul${attrs}>${cleaned}</ul>`
    }
    return `<ol${attrs}>${inner}</ol>`
  })

  // Strip literal bullet glyphs that AI often prefixes (causes double bullets with Quill)
  out = out.replace(/(<(?:li|p)[^>]*>)(\s*(?:<[^>]+>)*\s*)[•●▪◦‧∙·]\s+/gi, '$1$2')
  out = out.replace(/(<(?:li|p)[^>]*>)(\s*(?:<[^>]+>)*\s*)[-–—*]\s+/gi, '$1$2')

  // Strip inline background/color that paint white blocks on the dark editor
  out = out.replace(/\sstyle=(["'])(.*?)\1/gi, (match, quote, styleContent) => {
    const cleaned = styleContent
      .split(';')
      .map((part: string) => part.trim())
      .filter(Boolean)
      .filter((part: string) => !/^(background|background-color|color)\s*:/i.test(part))
      .join('; ')
    return cleaned ? ` style=${quote}${cleaned}${quote}` : ''
  })

  return out
}

/** Clean AI / pasted HTML before writing into the Quill editor. */
export function prepareEditorHtml(html?: string | null): string {
  let text = String(html || '').trim()
  text = text.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim()
  if (!text) return ''

  if (!/<[a-z][\s\S]*>/i.test(text)) {
    const lines = text
      .split(/\n+/)
      .map((line) => line.replace(/^[-*•●▪◦]\s*/, '').trim())
      .filter(Boolean)
    if (lines.length > 1) {
      text = `<ul>${lines.map((line) => `<li>${line}</li>`).join('')}</ul>`
    } else {
      text = `<p>${text.replace(/^[-*•●▪◦]\s*/, '')}</p>`
    }
  }

  return sanitizeRichTextHtml(text)
}

export function formatResumeDateRange(
  start?: string,
  end?: string,
  isCurrent?: boolean,
): string {
  const startLabel = formatMonthYear(start)
  const endLabel = isCurrent ? 'Present' : formatMonthYear(end)
  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`
  return startLabel || endLabel || ''
}

export function formatMonthYear(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
