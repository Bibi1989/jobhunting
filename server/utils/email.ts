/**
 * Minimal, dependency-free transactional email sender.
 *
 * Uses the Resend HTTP API when RESEND_API_KEY is configured (no SDK needed —
 * just fetch). When it is not configured, it logs and reports `sent: false` so
 * callers can still persist the message and degrade gracefully.
 */

export interface SendEmailAttachment {
  content: string // Base64 string
  filename: string
}

export interface SendEmailInput {
  to: string
  subject: string
  text: string
  /** Reply-To so the recipient can respond directly to the sender. */
  replyTo?: string
  attachments?: SendEmailAttachment[]
}

export interface SendEmailResult {
  sent: boolean
  reason?: string
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey || process.env.RESEND_API_KEY
  const from = config.contactFromEmail || process.env.CONTACT_FROM_EMAIL

  if (!apiKey || !from) {
    console.warn('[email] RESEND_API_KEY / CONTACT_FROM_EMAIL not set — email not sent')
    return { sent: false, reason: 'email_not_configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        ...(input.attachments ? { attachments: input.attachments } : {}),
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.warn(`[email] Resend failed (${res.status}): ${detail.slice(0, 300)}`)
      return { sent: false, reason: `provider_error_${res.status}` }
    }
    return { sent: true }
  } catch (error) {
    console.warn('[email] send threw:', error instanceof Error ? error.message : error)
    return { sent: false, reason: 'network_error' }
  }
}
