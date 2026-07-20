/**
 * Shared key so portfolio templates can open the public contact modal
 * (messages are emailed to the portfolio owner).
 */
import type { InjectionKey } from 'vue'

export type OpenPortfolioContact = () => void

export const portfolioContactKey: InjectionKey<OpenPortfolioContact> = Symbol('portfolioContactOpen')

export function useOpenPortfolioContact() {
  return inject(portfolioContactKey, null)
}

/** Always route hire CTAs through the contact form (#contact → modal). */
export function portfolioContactCta() {
  return { href: '#contact' as const, external: false as const }
}
