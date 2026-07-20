import * as cheerio from 'cheerio'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const MAX_HTML_LENGTH = 100_000

export interface FetchResult {
  html: string
  isError: boolean
  statusText: string
  status: number
  finalUrl: string
}

export async function fetchPageHtml(url: string): Promise<FetchResult> {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    })

    const html = await response.text()

    return {
      html,
      isError: !response.ok,
      statusText: `${response.status} ${response.statusText}`.trim(),
      status: response.status,
      finalUrl: response.url || url,
    }
  } catch (error) {
    return {
      html: '',
      isError: true,
      statusText: error instanceof Error ? error.message : 'Unknown fetch error',
      status: 0,
      finalUrl: url,
    }
  }
}

export function cleanHtmlForExtraction(html: string, sourceUrl: string): string {
  const $ = cheerio.load(html)

  $('script, style, noscript, svg, img, video, iframe, footer, header, nav').remove()

  $('a').each((_, el) => {
    const href = $(el).attr('href')
    if (href && !href.startsWith('http')) {
      try {
        $(el).attr('href', new URL(href, sourceUrl).href)
      } catch {
        // Ignore invalid URLs
      }
    }
  })

  return ($('body').html() || '').slice(0, MAX_HTML_LENGTH)
}

/** Keep form labels/inputs so application questions can be extracted. */
export function cleanHtmlForApplicationForm(html: string, sourceUrl: string): string {
  const $ = cheerio.load(html)

  $('script, style, noscript, svg, img, video, iframe').remove()

  $('a').each((_, el) => {
    const href = $(el).attr('href')
    if (href && !href.startsWith('http')) {
      try {
        $(el).attr('href', new URL(href, sourceUrl).href)
      } catch {
        // ignore
      }
    }
  })

  const formParts: string[] = []

  $('form, [role="form"], .application, .application-form, #application, .job-application').each(
    (_, el) => {
      formParts.push($.html(el) || '')
    },
  )

  $('label, legend, fieldset, input, textarea, select, button[type="submit"]').each((_, el) => {
    const tag = (el as { tagName?: string }).tagName?.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'label' || tag === 'legend') {
      formParts.push($.html(el) || '')
    }
  })

  const combined = formParts.join('\n')
  if (combined.length > 500) {
    return combined.slice(0, MAX_HTML_LENGTH)
  }

  return ($('body').html() || '').slice(0, MAX_HTML_LENGTH)
}

export function shouldUseSearchFallback(
  isError: boolean,
  cleanedHtml: string,
  status: number,
): boolean {
  if (isError || status >= 400) return true
  if (cleanedHtml.length < 100) return true

  const lower = cleanedHtml.toLowerCase()
  const looksLikeShell =
    !lower.includes('job') &&
    !lower.includes('career') &&
    !lower.includes('opening') &&
    !lower.includes('position')

  return looksLikeShell
}
