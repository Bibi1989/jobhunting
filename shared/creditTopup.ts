/** Shared credit top-up catalog (client + server). Prices in euro cents. */
export type CreditTopupPackId = 'pack50' | 'pack100' | 'pack150'

export type CreditTopupPack = {
  id: CreditTopupPackId
  credits: number
  eurCents: number
  label: string
}

export const CREDIT_TOPUP_PACKS: readonly CreditTopupPack[] = [
  { id: 'pack50', credits: 50, eurCents: 499, label: '50 credits' },
  { id: 'pack100', credits: 100, eurCents: 799, label: '100 credits' },
  { id: 'pack150', credits: 150, eurCents: 999, label: '150 credits' },
] as const

export function getCreditTopupPack(id: unknown): CreditTopupPack | null {
  if (typeof id !== 'string') return null
  return CREDIT_TOPUP_PACKS.find((p) => p.id === id) || null
}
