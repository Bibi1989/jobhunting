/**
 * Shared contact-line helpers for resume + cover-letter PDFs.
 * Formats LinkedIn / GitHub cleanly and builds absolute hrefs.
 */

export type ContactKind = 'email' | 'phone' | 'location' | 'linkedin' | 'github' | 'portfolio'

export type ContactEntry = {
  kind: ContactKind
  /** Short label for sidebar / stacked layouts (e.g. "LinkedIn"). */
  label: string
  /** Human-readable text shown on the PDF. */
  display: string
  /** Absolute URL when the entry is linkable. */
  href?: string
}

function trimValue(value?: string | null): string {
  return String(value || '').trim()
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
}

/** Normalize LinkedIn into linkedin.com/in/handle (+ https href). */
export function formatLinkedIn(raw?: string | null): ContactEntry | null {
  const value = trimValue(raw)
  if (!value) return null

  let path = stripProtocol(value)
  if (/^in\//i.test(path)) path = `linkedin.com/${path}`
  else if (!/linkedin\.com/i.test(path)) {
    // Bare handle: "jonathansterling" or "/in/jonathansterling"
    const handle = path.replace(/^\/+/, '').replace(/^in\//i, '')
    path = `linkedin.com/in/${handle}`
  }

  path = path.replace(/^linkedin\.com/i, 'linkedin.com')
  return {
    kind: 'linkedin',
    label: 'LinkedIn',
    display: `https://${path}`,
    href: `https://www.${path.replace(/^linkedin\.com/i, 'linkedin.com')}`,
  }
}

/** Normalize GitHub into github.com/handle (+ https href). */
export function formatGitHub(raw?: string | null): ContactEntry | null {
  const value = trimValue(raw)
  if (!value) return null

  let path = stripProtocol(value).replace(/^gh\//i, '')
  if (!/github\.com/i.test(path)) {
    const handle = path.replace(/^\/+/, '')
    path = `github.com/${handle}`
  }

  path = path.replace(/^github\.com/i, 'github.com')
  return {
    kind: 'github',
    label: 'GitHub',
    display: `https://${path}`,
    href: `https://${path}`,
  }
}

/** Clean portfolio / personal site URL for display. */
export function formatPortfolio(raw?: string | null): ContactEntry | null {
  const value = trimValue(raw)
  if (!value) return null
  const display = stripProtocol(value)
  if (!display) return null
  return {
    kind: 'portfolio',
    label: 'Portfolio',
    display,
    href: /^https?:\/\//i.test(value) ? value : `https://${display}`,
  }
}

export function formatEmail(raw?: string | null): ContactEntry | null {
  const value = trimValue(raw)
  if (!value) return null
  return {
    kind: 'email',
    label: 'Email',
    display: value,
    href: `mailto:${value}`,
  }
}

export function formatPhone(raw?: string | null): ContactEntry | null {
  const value = trimValue(raw)
  if (!value) return null
  const tel = value.replace(/[^\d+]/g, '')
  return {
    kind: 'phone',
    label: 'Phone',
    display: value,
    href: tel ? `tel:${tel}` : undefined,
  }
}

export function formatLocation(raw?: string | null): ContactEntry | null {
  const value = trimValue(raw)
  if (!value) return null
  return {
    kind: 'location',
    label: 'Location',
    display: value,
  }
}

type PersonalContactFields = {
  email?: string | null
  phone?: string | null
  location?: string | null
  linkedin?: string | null
  github?: string | null
  portfolio?: string | null
}

/**
 * Ordered contact entries for headers / sidebars.
 * Always includes LinkedIn and GitHub when present (never collapses to one).
 */
export function buildContactEntries(p: PersonalContactFields): ContactEntry[] {
  return [
    formatEmail(p.email),
    formatPhone(p.phone),
    formatLocation(p.location),
    formatLinkedIn(p.linkedin),
    formatGitHub(p.github),
    formatPortfolio(p.portfolio),
  ].filter((entry): entry is ContactEntry => Boolean(entry))
}

/** Plain display strings joined with a separator (cover-letter text headers). */
export function joinContactDisplays(
  p: PersonalContactFields,
  separator = '  ·  ',
): string {
  return buildContactEntries(p)
    .map((e) => e.display)
    .join(separator)
}
