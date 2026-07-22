import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: ['nuxt-auth-utils', '@nuxtjs/color-mode', '@nuxtjs/i18n'],
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
    storageKey: 'jobflow-color-mode',
  },
  i18n: {
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
    ],
    lazy: true,
    langDir: 'locales', // resolved under web/i18n/locales by @nuxtjs/i18n
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'jobflow_i18n',
      redirectOn: 'root',
      fallbackLocale: 'en',
    },
  },
  app: {
    head: {
      title: 'JobFlow',
      titleTemplate: '%s · JobFlow',
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@500&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
        },
      ],
      meta: [
        { name: 'theme-color', content: '#0f172a' },
        { name: 'description', content: 'JobFlow — Intelligent Job Hub' },
      ],
    },
  },
  css: ['~/assets/css/main.css', '~/assets/css/document-preview.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  nitro: {
    // Ensure react-pdf + react ship with the server bundle
    externals: {
      inline: ['@react-pdf/renderer', 'react', 'react-dom'],
    },
  },
  runtimeConfig: {
    /**
     * Secrets and model MUST come from env at runtime (Netlify / web/.env).
     * Do not bake API keys or production models into this file.
     *   GEMINI_API_KEY or NUXT_GEMINI_API_KEY
     *   GEMINI_MODEL or NUXT_GEMINI_MODEL  (Pro drafts: resume / cover / portfolio / ATS fix)
     *   GEMINI_MODEL_PARSEKIT or NUXT_GEMINI_MODEL_PARSEKIT  (Flash: parse / ATS check / email / enhance; default gemini-2.5-flash)
     */
    geminiApiKey: '',
    geminiModel: '',
    geminiModelParsekit: '',
    // Empty default — set DATABASE_URL or NUXT_DATABASE_URL at runtime (Netlify).
    // Do not bake a localhost URL here or prod will silently ignore DATABASE_URL.
    databaseUrl: '',
    ollamaBaseUrl: '',
    ollamaModel: '',
    ollamaFallbackModels: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    stripePriceProMonthly: '',
    appUrl: '',
    adminEmails: '',
    resendApiKey: '',
    contactFromEmail: '',
    /** Override with NUXT_API_PROXY_TARGET */
    apiProxyTarget: '',
    session: {
      /** Override with NUXT_SESSION_PASSWORD (≥32 chars). Dev fallback only. */
      password: '',
    },
    public: {
      appName: 'JobFlow',
      /**
       * Override with NUXT_PUBLIC_API_BACKEND=nuxt|fastapi
       * (do not bake process.env here — Nuxt must apply env overrides at runtime)
       */
      apiBackend: 'nuxt',
      /**
       * Chrome Web Store listing URL. When set, /extension/install shows
       * “Add to Chrome” and opens this URL (Chrome’s install prompt lives there).
       * Override with NUXT_PUBLIC_CHROME_EXTENSION_STORE_URL
       */
      chromeExtensionStoreUrl: '',
    },
  },
})
