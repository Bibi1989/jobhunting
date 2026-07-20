import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: ['nuxt-auth-utils'],
  app: {
    head: {
      link: [
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
    geminiApiKey: '',
    geminiModel: 'gemini-2.0-flash',
    databaseUrl: 'postgresql://scraper:scraper@localhost:5432/job_scraper',
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaModel: 'gemma4:e4b',
    ollamaFallbackModels: 'llama3.2:latest',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    stripePriceProMonthly: '',
    appUrl: 'http://localhost:3000',
    adminEmails: '',
    resendApiKey: '',
    contactFromEmail: '',
    /** Override with NUXT_API_PROXY_TARGET */
    apiProxyTarget: 'http://127.0.0.1:8000',
    session: {
      password: 'jobflow-dev-session-password-change-me-32chars',
    },
    public: {
      appName: 'JobFlow AI',
      /**
       * Override with NUXT_PUBLIC_API_BACKEND=nuxt|fastapi
       * (do not bake process.env here — Nuxt must apply env overrides at runtime)
       */
      apiBackend: 'nuxt',
    },
  },
})
