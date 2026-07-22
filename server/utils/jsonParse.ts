/**
 * Extract and parse JSON from model responses, including truncated output
 * (e.g. network cutoffs or incomplete model replies).
 */

export function extractJsonObject(text: string): string {
  const trimmed = String(text || '').trim()
  if (!trimmed) return '{}'
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] || trimmed).trim()
  if (candidate.startsWith('{') || candidate.startsWith('[')) return candidate
  const start = candidate.search(/[{[]/)
  if (start < 0) return candidate
  return candidate.slice(start)
}

/** Close open strings / braces so truncated model JSON can still parse. */
export function repairTruncatedJson(input: string): string {
  let s = String(input || '').trim()
  if (!s) return '{}'

  // Drop a trailing incomplete escape sequence
  if (s.endsWith('\\')) s = s.slice(0, -1)

  let inString = false
  let escape = false
  const stack: Array<'{' | '['> = []

  for (let i = 0; i < s.length; i++) {
    const c = s[i]!
    if (escape) {
      escape = false
      continue
    }
    if (inString) {
      if (c === '\\') {
        escape = true
        continue
      }
      if (c === '"') inString = false
      continue
    }
    if (c === '"') {
      inString = true
      continue
    }
    if (c === '{' || c === '[') stack.push(c)
    else if (c === '}' || c === ']') {
      const open = stack[stack.length - 1]
      if ((c === '}' && open === '{') || (c === ']' && open === '[')) stack.pop()
    }
  }

  if (inString) s += '"'
  s = s.replace(/,\s*$/, '')

  while (stack.length) {
    const open = stack.pop()
    s += open === '{' ? '}' : ']'
  }
  return s
}

export function parseModelJson<T = unknown>(text: string): T {
  const extracted = extractJsonObject(text)
  try {
    return JSON.parse(extracted) as T
  } catch (first) {
    try {
      return JSON.parse(repairTruncatedJson(extracted)) as T
    } catch {
      const hint =
        first instanceof Error && /Unterminated string|position \d+/i.test(first.message)
          ? ' Model output was truncated or invalid JSON — try again.'
          : ''
      throw new Error(`Invalid JSON from AI.${hint}`)
    }
  }
}
