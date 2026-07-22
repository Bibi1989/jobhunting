import { extractKeywordsFromText } from '~/utils/keywordExtractor'

export type LocalAtsKeyword = {
  keyword: string
  found: boolean
  count: number
}

export type LocalAtsResult = {
  score: number
  total: number
  matched: number
  missing: string[]
  found: string[]
  keywords: LocalAtsKeyword[]
  strengths: string[]
  improvements: string[]
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  const lower = haystack.toLowerCase()
  const target = needle.toLowerCase()
  let count = 0
  let idx = 0
  while (true) {
    const next = lower.indexOf(target, idx)
    if (next < 0) break
    count += 1
    idx = next + target.length
  }
  return count
}

/** Client-side keyword coverage score — no LLM. */
export function scoreLocalAts(resumeText: string, jobDescription?: string): LocalAtsResult {
  const resume = String(resumeText || '').trim()
  const jd = String(jobDescription || '').trim()
  const keywords = extractKeywordsFromText(jd || resume).slice(0, 40)

  const analyzed: LocalAtsKeyword[] = keywords.map((keyword) => {
    const count = countOccurrences(resume, keyword)
    return { keyword, found: count > 0, count }
  })

  const matched = analyzed.filter((k) => k.found).length
  const total = analyzed.length
  const score = total === 0 ? (resume.length > 80 ? 55 : 20) : Math.round((matched / total) * 100)
  const missing = analyzed.filter((k) => !k.found).map((k) => k.keyword)
  const found = analyzed.filter((k) => k.found).map((k) => k.keyword)

  const strengths: string[] = []
  const improvements: string[] = []

  if (resume.length > 400) strengths.push('Resume has substantial content to scan.')
  if (found.length) strengths.push(`Matched ${found.length} target keyword${found.length === 1 ? '' : 's'} from the job description.`)
  if (score >= 70) strengths.push('Strong keyword coverage for an automated screen.')

  if (!jd) improvements.push('Paste a job description for a more accurate keyword match.')
  if (missing.length) {
    improvements.push(
      `Add missing keywords where honest: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''}.`,
    )
  }
  if (score < 55) improvements.push('Weave role-specific skills into summary, experience bullets, and skills section.')
  if (!strengths.length) strengths.push('Start by pasting a target job description and your resume text.')

  return {
    score,
    total,
    matched,
    missing,
    found,
    keywords: analyzed,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
  }
}
