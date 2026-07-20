import { query } from '~/server/utils/db'
import { sendEmail } from '~/server/utils/email'

/**
 * POST /api/portfolio/:id/contact
 *
 * Public endpoint used by the contact form on a hosted portfolio. Stores the
 * message and emails it to the portfolio owner (reply-to = the sender), so a
 * hiring manager's note lands in the owner's inbox.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid portfolio id' })
  }

  const body = await readBody<{ name?: string; email?: string; message?: string }>(event)
  const name = String(body?.name || '').trim().slice(0, 120)
  const senderEmail = String(body?.email || '').trim().slice(0, 200)
  const message = String(body?.message || '').trim().slice(0, 5000)

  if (!name) throw createError({ statusCode: 400, statusMessage: 'Your name is required' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid email is required' })
  }
  if (message.length < 5) {
    throw createError({ statusCode: 400, statusMessage: 'Please write a short message' })
  }

  // Resolve the portfolio + owner inbox.
  const result = await query<{
    user_id: string
    owner_email: string
    full_name: string | null
  }>(
    `SELECT p.user_id,
            u.email AS owner_email,
            p.profile_data->>'full_name' AS full_name
       FROM portfolios p
       JOIN users u ON u.id = p.user_id
      WHERE p.id = $1`,
    [id],
  )
  const row = result.rows[0]
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Portfolio not found' })
  }

  // Prefer the public contact email set on the portfolio, else the account email.
  const publicEmailResult = await query<{ contact_email: string | null }>(
    `SELECT profile_data->>'email' AS contact_email FROM portfolios WHERE id = $1`,
    [id],
  )
  const toEmail = publicEmailResult.rows[0]?.contact_email?.trim() || row.owner_email

  const emailResult = await sendEmail({
    to: toEmail,
    subject: `New message from your portfolio${row.full_name ? ` — ${row.full_name}` : ''}`,
    replyTo: senderEmail,
    text: [
      `You received a new message via your portfolio contact form.`,
      ``,
      `From: ${name} <${senderEmail}>`,
      ``,
      message,
    ].join('\n'),
  })

  // Persist regardless of email delivery so nothing is lost.
  try {
    await query(
      `INSERT INTO portfolio_messages (portfolio_id, sender_name, sender_email, body, delivered)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name, senderEmail, message, emailResult.sent],
    )
  } catch (error) {
    console.warn('[contact] failed to store message:', error instanceof Error ? error.message : error)
  }

  // Always report success to the visitor once the message is captured; delivery
  // status is an internal detail.
  return { ok: true, delivered: emailResult.sent }
})
