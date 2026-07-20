import { formatGeminiError } from './jobs'
import { ollamaChat, parseJsonObject } from './ollama'

export function isGeminiQuotaOrUnavailableError(error: unknown): boolean {
  const message = formatGeminiError(error).toLowerCase()
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: string }).message || '')
        : String(error || '')

  const haystack = `${message}\n${raw}`.toLowerCase()

  return (
    haystack.includes('quota') ||
    haystack.includes('rate limit') ||
    haystack.includes('rate-limit') ||
    haystack.includes('resource_exhausted') ||
    haystack.includes('too many requests') ||
    haystack.includes('exceeded your current quota') ||
    haystack.includes('unavailable') ||
    haystack.includes('high demand') ||
    /\b429\b/.test(haystack) ||
    /\b503\b/.test(haystack)
  )
}

export async function ollamaJsonPrompt<T>(input: {
  system: string
  user: string
  temperature?: number
}): Promise<T> {
  const content = await ollamaChat({
    format: 'json',
    temperature: input.temperature ?? 0.3,
    messages: [
      { role: 'system', content: input.system },
      { role: 'user', content: input.user },
    ],
  })

  return parseJsonObject<T & Record<string, unknown>>(content) as T
}

export async function ollamaTextPrompt(input: {
  system: string
  user: string
  temperature?: number
}): Promise<string> {
  return ollamaChat({
    temperature: input.temperature ?? 0.4,
    messages: [
      { role: 'system', content: input.system },
      { role: 'user', content: input.user },
    ],
  })
}
