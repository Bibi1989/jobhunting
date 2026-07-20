/**
 * @nuxt/schema 3.15 omits `nitro` from `NuxtConfig` even though it is valid
 * runtime config. Restore it for nuxt.config.ts typechecking.
 */
import type { NitroConfig } from 'nitropack'

declare module '@nuxt/schema' {
  interface NuxtConfig {
    nitro?: NitroConfig
  }
}

declare module 'nuxt/schema' {
  interface NuxtConfig {
    nitro?: NitroConfig
  }
}

export {}
