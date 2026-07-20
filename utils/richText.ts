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
  if (startLabel && endLabel) return `${startLabel}, ${endLabel}`
  return startLabel || endLabel || ''
}

export function formatMonthYear(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
