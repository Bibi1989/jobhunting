export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OllamaChatOptions {
  model?: string
  messages: OllamaChatMessage[]
  format?: 'json' | Record<string, unknown>
  temperature?: number
}

export async function ollamaChat(options: OllamaChatOptions): Promise<string> {
  const config = useRuntimeConfig()
  const baseUrl = String(config.ollamaBaseUrl || 'http://localhost:11434').replace(/\/$/, '')
  const primary = options.model || String(config.ollamaModel || 'gemma4:e4b')
  const fallbacks = String(config.ollamaFallbackModels || 'llama3.2:latest')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  const models = [primary, ...fallbacks.filter((m) => m !== primary)]

  let lastError: unknown

  for (const model of models) {
    try {
      return await chatOnce(baseUrl, model, options)
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Ollama model ${model} failed:`, message)
      if (!/not found|pull|404|does not exist/i.test(message) && models.length === 1) {
        throw error
      }
    }
  }

  if (lastError && typeof lastError === 'object' && 'statusCode' in lastError) {
    throw lastError
  }

  throw createError({
    statusCode: 503,
    statusMessage:
      lastError instanceof Error
        ? lastError.message
        : `No usable Ollama model. Tried: ${models.join(', ')}`,
  })
}

async function chatOnce(
  baseUrl: string,
  model: string,
  options: OllamaChatOptions,
): Promise<string> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: options.format,
        options: {
          temperature: options.temperature ?? 0.4,
        },
        messages: options.messages,
      }),
    })
  } catch (error) {
    throw createError({
      statusCode: 503,
      statusMessage:
        error instanceof Error
          ? `Ollama is unreachable at ${baseUrl}. Start Ollama and pull model ${model}. (${error.message})`
          : `Ollama is unreachable at ${baseUrl}.`,
    })
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw createError({
      statusCode: 503,
      statusMessage: `Ollama error for ${model} (${response.status}): ${body.slice(0, 300) || response.statusText}`,
    })
  }

  const data = (await response.json()) as {
    message?: { content?: string }
  }

  const content = data.message?.content?.trim()
  if (!content) {
    throw createError({
      statusCode: 502,
      statusMessage: `Ollama model ${model} returned an empty response`,
    })
  }

  return content
}

export function parseJsonObject<T extends Record<string, unknown>>(text: string): T {
  try {
    return JSON.parse(text) as T
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim()) as T
    }

    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as T
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Could not parse JSON from Ollama response',
    })
  }
}
