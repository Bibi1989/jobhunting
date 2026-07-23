<script setup lang="ts">
/**
 * Extension install landing — same pattern as most SaaS apps:
 * CTA opens the Chrome Web Store listing (when configured), where Chrome
 * shows the real “Add to Chrome” install prompt.
 *
 * Set NUXT_PUBLIC_CHROME_EXTENSION_STORE_URL after publishing.
 */
definePageMeta({
  layout: false,
})

const { t } = useI18n()

useHead({
  title: () => t('extension.installTitle'),
})

const config = useRuntimeConfig()
const { installed, checking, refresh } = useJobflowExtension()

const storeUrl = computed(() =>
  String(config.public.chromeExtensionStoreUrl || '').trim(),
)
const hasStoreListing = computed(() => /^https?:\/\//i.test(storeUrl.value))

const steps = computed(() => [
  t('extension.step1'),
  t('extension.step2'),
  t('extension.step3'),
])

function addToChrome() {
  if (!hasStoreListing.value) return
  window.open(storeUrl.value, '_blank', 'noopener,noreferrer')
}

let pollId = 0
onMounted(() => {
  pollId = window.setInterval(refresh, 1500)
})
onBeforeUnmount(() => {
  if (pollId) window.clearInterval(pollId)
})
</script>

<template>
  <div
    class="min-h-dvh px-6 py-12 flex flex-col items-center"
    style="background: var(--app-bg); color: var(--app-fg)"
  >
    <div class="w-full max-w-lg">
      <NuxtLink
        to="/apply"
        class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-80 mb-10"
        style="color: var(--app-muted)"
      >
        <span class="material-symbols-outlined text-[16px]">arrow_back</span>
        {{ t('nav.back') }}
      </NuxtLink>

      <div
        class="rounded-3xl border p-8 md:p-10 text-center"
        style="border-color: var(--app-border); background: var(--app-bg-elevated)"
      >
        <div
          class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border"
          style="
            background: color-mix(in srgb, var(--app-accent) 12%, transparent);
            border-color: color-mix(in srgb, var(--app-accent) 35%, var(--app-border));
            color: var(--app-accent);
          "
        >
          <span class="material-symbols-outlined text-3xl">extension</span>
        </div>

        <p
          class="text-[11px] font-bold uppercase tracking-[0.2em] mb-2"
          style="color: var(--app-accent)"
        >
          {{ t('extension.brandChrome') }}
        </p>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight" style="color: var(--app-fg)">
          {{ t('extension.headline') }}
        </h1>
        <p class="mt-3 text-sm leading-relaxed" style="color: var(--app-muted)">
          {{ t('extension.subtitle') }}
        </p>

        <div
          v-if="checking"
          class="mt-8 text-sm"
          style="color: var(--app-muted)"
        >
          {{ t('extension.checking') }}
        </div>

        <div
          v-else-if="installed"
          class="mt-8 rounded-xl border px-4 py-3 text-sm"
          style="
            border-color: color-mix(in srgb, #10b981 40%, var(--app-border));
            background: color-mix(in srgb, #10b981 12%, var(--app-bg-elevated));
            color: var(--app-fg);
          "
        >
          {{ t('extension.detected') }}
        </div>

        <template v-else>
          <button
            v-if="hasStoreListing"
            type="button"
            class="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold px-5 py-3.5 transition-colors cursor-pointer bg-[#1a73e8] hover:bg-[#1765cc]"
            style="color: #fff"
            @click="addToChrome"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              <circle cx="12" cy="12" r="4.5" fill="currentColor"/>
            </svg>
            {{ t('extension.addToChrome') }}
          </button>
          <p v-if="hasStoreListing" class="mt-3 text-[11px]" style="color: var(--app-muted)">
            {{ t('extension.addToChromeHint') }}
          </p>

          <div v-else class="mt-8 text-left">
            <p
              class="text-xs font-semibold uppercase tracking-wider mb-3"
              style="color: var(--app-muted)"
            >
              {{ t('extension.devInstallTitle') }}
            </p>
            <ol
              class="space-y-2 text-sm list-decimal pl-5 leading-relaxed"
              style="color: var(--app-fg)"
            >
              <li v-for="(step, i) in steps" :key="i">{{ step }}</li>
            </ol>
            <p class="mt-4 text-[11px] leading-relaxed" style="color: var(--app-muted)">
              {{ t('extension.devInstallHint') }}
            </p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
