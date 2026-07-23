import { getProDisplayPricing } from '~/server/utils/stripe'

/** Public Pro price board — amounts come from STRIPE_PRICE_PRO_* env. */
export default defineEventHandler(() => getProDisplayPricing())
