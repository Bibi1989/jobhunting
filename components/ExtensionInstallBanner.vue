<script setup lang="ts">
const { t } = useI18n()
const { showBanner, dismissBanner } = useJobflowExtension()
</script>

<template>
  <div
    v-if="showBanner"
    class="extension-install-banner rounded-2xl border px-4 py-3.5 text-left"
    role="status"
  >
    <div class="flex items-start gap-3">
      <span
        class="material-symbols-outlined shrink-0 mt-0.5 text-[22px]"
        style="color: var(--app-accent)"
        aria-hidden="true"
      >
        extension
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold" style="color: var(--app-fg)">
          {{ t('extension.bannerTitle') }}
        </p>
        <p class="text-[12px] mt-1 leading-relaxed" style="color: var(--app-muted)">
          {{ t('extension.bannerBody') }}
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <NuxtLink
            to="/extension/install"
            class="inline-flex items-center gap-1.5 rounded-lg text-[11px] font-semibold px-3 py-1.5 transition-opacity hover:opacity-90"
            style="background: var(--app-accent); color: #fff"
          >
            <span class="material-symbols-outlined text-[14px]">extension</span>
            {{ t('extension.addExtension') }}
          </NuxtLink>
          <button
            type="button"
            class="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
            style="color: var(--app-muted)"
            :aria-label="t('extension.dismiss')"
            :title="t('extension.dismiss')"
            @click="dismissBanner"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.extension-install-banner {
  border-color: color-mix(in srgb, var(--app-accent) 35%, var(--app-border));
  background: color-mix(in srgb, var(--app-accent) 10%, var(--app-bg-elevated));
}
</style>
