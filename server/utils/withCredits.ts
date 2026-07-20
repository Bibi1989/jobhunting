import type { EventHandler, EventHandlerRequest, H3Event } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { decrementCreditAtomic, getCreditsRemaining } from '~/server/utils/db'

export type WithCreditsOptions = {
  /** Credits to charge after a successful response (default 1) */
  cost?: number
  reason?: string
  /** When true, only Pro subscribers may call this route (AI features) */
  requirePro?: boolean
  /** Override the 403 message shown to non-Pro users. */
  proMessage?: string
  /** Override the 403 message shown when the user lacks enough credits. */
  insufficientCreditsMessage?: string
}

/**
 * Protects premium Nitro routes: require auth, ensure credits (and optionally Pro),
 * run handler, then atomically decrement credits on success.
 * Admins bypass plan/credit checks and are not charged.
 */
export function withCredits<T extends EventHandlerRequest = EventHandlerRequest>(
  handler: EventHandler<T>,
  options: WithCreditsOptions = {},
): EventHandler<T> {
  const cost = options.cost ?? 1
  const reason = options.reason ?? 'ai_usage'
  const requirePro = options.requirePro ?? false
  const proMessage =
    options.proMessage ??
    'A Pro subscription is required to use AI features. Upgrade on the pricing page.'
  const insufficientCreditsMessage =
    options.insufficientCreditsMessage ??
    'Insufficient credits. Upgrade your plan to continue.'

  return defineEventHandler(async (event: H3Event) => {
    const user = await requireUser(event)

    if (user.role === 'admin') {
      return handler(event)
    }

    if (requirePro && user.planTier !== 'pro') {
      throw createError({
        statusCode: 403,
        statusMessage: proMessage,
      })
    }

    const credits = await getCreditsRemaining(user.id)

    if (credits < cost) {
      throw createError({
        statusCode: 403,
        statusMessage: insufficientCreditsMessage,
      })
    }

    const result = await handler(event)

    const updated = await decrementCreditAtomic(user.id, cost, reason)
    if (!updated) {
      console.warn(`[withCredits] Failed to decrement credits for user ${user.id}`)
    } else {
      event.context.user = updated
      setHeader(event, 'x-credits-remaining', String(updated.creditsRemaining))
    }

    return result
  }) as EventHandler<T>
}
