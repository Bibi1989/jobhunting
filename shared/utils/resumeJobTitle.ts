/**
 * Best-effort job title from resume plain text (upload extract or builder export).
 * Used to target related openings during scrape when the user enables “Use resume”.
 */
export function extractJobTitleFromResumeText(text: string): string {
  const raw = String(text || '')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim()
  if (!raw) return ''

  const labeled = raw.match(
    /(?:^|\n)\s*(?:job\s*title|professional\s*title|title|position|role|desired\s*role|target\s*role)\s*[:\-–]\s*(.+)/i,
  )
  if (labeled?.[1]) {
    const fromLabel = cleanTitleLine(labeled[1].split('\n')[0] || '')
    if (fromLabel) return fromLabel
  }

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12)

  for (let i = 0; i < lines.length; i++) {
    const line = cleanTitleLine(lines[i])
    if (!line) continue
    if (/@|https?:\/\/|www\.|\+?\d[\d\s().-]{6,}/i.test(line)) continue
    if (
      /^(curriculum|resume|cv|profile|summary|objective|experience|education|skills|contact|phone|email|linkedin|github|portfolio)\b/i.test(
        line,
      )
    ) {
      continue
    }
    // First line is often the name — skip name-like tokens unless it looks like a title.
    if (i === 0 && looksLikePersonName(line) && !looksLikeJobTitle(line)) continue
    if (looksLikeJobTitle(line) || i >= 1) return line
  }

  return ''
}

function cleanTitleLine(line: string): string {
  const cleaned = line
    .replace(/[|•·]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\-–—*]+/, '')
    .trim()
  if (cleaned.length < 2 || cleaned.length > 80) return ''
  return cleaned
}

function looksLikePersonName(line: string): boolean {
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 4) return false
  return words.every((w) => /^[A-Z][a-z'’-]+$/.test(w) || /^[A-Z]\.?$/.test(w))
}

function looksLikeJobTitle(line: string): boolean {
  return /\b(engineer|developer|designer|manager|director|lead|architect|analyst|scientist|consultant|specialist|officer|founder|product|frontend|backend|fullstack|full[- ]stack|software|data|devops|sre|qa|mobile|ios|android|marketing|sales|recruiter|hr|finance|accountant|nurse|teacher|lawyer|attorney|intern|internship|assistant|coordinator|executive|ceo|cto|cfo|coo|vp|head)\b/i.test(
    line,
  )
}
