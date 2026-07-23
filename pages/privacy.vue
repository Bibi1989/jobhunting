<script setup lang="ts">
/**
 * Public privacy policy for JobFlow web app + Chrome extension.
 * Chrome Web Store requires a stable HTTPS URL — use your production origin + /privacy
 */
definePageMeta({
  layout: false,
})

const { t } = useI18n()
const config = useRuntimeConfig()
const appName = computed(() => String(config.public.appName || 'JobFlow'))
const updated = 'July 23, 2026'

useHead({
  title: () => t('privacy.metaTitle'),
  meta: [
    {
      name: 'description',
      content: () => t('privacy.metaDescription'),
    },
  ],
})
</script>

<template>
  <div class="min-h-dvh" style="background: var(--app-bg); color: var(--app-fg)">
    <header class="border-b px-6 py-4" style="border-color: var(--app-border)">
      <div class="max-w-3xl mx-auto flex items-center justify-between gap-4">
        <AppLogo size="sm" :show-tagline="false" />
        <NuxtLink
          to="/"
          class="text-sm font-semibold transition-opacity hover:opacity-80"
          style="color: var(--app-muted)"
        >
          {{ t('nav.home') }}
        </NuxtLink>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-6 py-12 prose-invert">
      <p class="text-xs font-bold uppercase tracking-widest mb-3" style="color: var(--app-accent)">
        {{ t('privacy.eyebrow') }}
      </p>
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
        {{ t('privacy.title') }}
      </h1>
      <p class="text-sm mb-10" style="color: var(--app-muted)">
        {{ t('privacy.updated', { date: updated, app: appName }) }}
      </p>

      <section class="space-y-8 text-sm leading-relaxed" style="color: var(--app-muted)">
        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">{{ t('privacy.s1Title') }}</h2>
          <p>{{ t('privacy.s1Body', { app: appName }) }}</p>
        </div>

        <div id="extension">
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">{{ t('privacy.s2Title') }}</h2>
          <p class="mb-3">{{ t('privacy.s2Intro', { app: appName }) }}</p>
          <ul class="list-disc pl-5 space-y-2">
            <li>
              <strong style="color: var(--app-fg)">{{ t('privacy.s2WebsiteLabel') }}</strong>
              {{ t('privacy.s2Website') }}
            </li>
            <li>
              <strong style="color: var(--app-fg)">{{ t('privacy.s2AuthLabel') }}</strong>
              {{ t('privacy.s2Auth', { app: appName }) }}
            </li>
            <li>
              <strong style="color: var(--app-fg)">{{ t('privacy.s2LocalLabel') }}</strong>
              {{ t('privacy.s2Local') }}
            </li>
            <li>
              <strong style="color: var(--app-fg)">{{ t('privacy.s2DetectLabel') }}</strong>
              {{ t('privacy.s2Detect', { app: appName }) }}
            </li>
          </ul>
          <p class="mt-3">{{ t('privacy.s2Outro', { app: appName }) }}</p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">{{ t('privacy.s3Title') }}</h2>
          <p class="mb-3">{{ t('privacy.s3Intro', { app: appName }) }}</p>
          <ul class="list-disc pl-5 space-y-2">
            <li>{{ t('privacy.s3Item1') }}</li>
            <li>{{ t('privacy.s3Item2') }}</li>
            <li>{{ t('privacy.s3Item3') }}</li>
            <li>{{ t('privacy.s3Item4') }}</li>
          </ul>
          <p class="mt-3">{{ t('privacy.s3Ai') }}</p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">{{ t('privacy.s4Title') }}</h2>
          <p>{{ t('privacy.s4Body') }}</p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">{{ t('privacy.s5Title') }}</h2>
          <p>{{ t('privacy.s5Body', { app: appName }) }}</p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">{{ t('privacy.s6Title') }}</h2>
          <p>{{ t('privacy.s6Body') }}</p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">{{ t('privacy.s7Title') }}</h2>
          <p>{{ t('privacy.s7Body', { app: appName }) }}</p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">{{ t('privacy.s8Title') }}</h2>
          <p>{{ t('privacy.s8Body') }}</p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">{{ t('privacy.s9Title') }}</h2>
          <p>
            {{ t('privacy.s9Body') }}
            <a
              class="underline"
              style="color: var(--app-accent)"
              href="mailto:privacy@jobflow.app"
            >privacy@jobflow.app</a>
            {{ t('privacy.s9Note') }}
          </p>
        </div>
      </section>
    </main>

    <footer class="border-t px-6 py-8 text-center text-sm" style="border-color: var(--app-border); color: var(--app-muted)">
      © {{ new Date().getFullYear() }} {{ appName }} ·
      <NuxtLink to="/privacy" class="underline">{{ t('nav.privacy') }}</NuxtLink>
    </footer>
  </div>
</template>
