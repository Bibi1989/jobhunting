/** Nitro health — used when NUXT_PUBLIC_API_BACKEND=nuxt (or FastAPI is down). */
export default defineEventHandler(() => {
  return {
    ok: true,
    backend: 'nuxt',
    app: 'JobFlow AI',
  }
})
