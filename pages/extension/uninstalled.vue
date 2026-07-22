<script setup lang="ts">
/**
 * Opened by Chrome via chrome.runtime.setUninstallURL when the extension is removed.
 * Clears install/dismiss flags so the in-app banner can show again.
 */
import { clearJobflowExtensionFlags } from '~/composables/useJobflowExtension'

definePageMeta({
  layout: false,
})

useHead({ title: 'Extension removed' })

onMounted(() => {
  clearJobflowExtensionFlags()
  try {
    delete document.documentElement.dataset.jobflowExtension
  } catch {
    /* ignore */
  }
})
</script>

<template>
  <div
    class="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center"
    style="background: var(--app-bg); color: var(--app-fg)"
  >
    <span class="material-symbols-outlined text-4xl" style="color: var(--app-accent)" aria-hidden="true">
      extension_off
    </span>
    <h1 class="text-xl font-semibold" style="color: var(--app-fg)">JobFlow extension removed</h1>
    <p class="max-w-md text-sm leading-relaxed" style="color: var(--app-muted)">
      Install flags were cleared. The install banner will show again on Apply and Target Role when you next open JobFlow.
    </p>
    <NuxtLink
      to="/apply"
      class="mt-2 inline-flex items-center rounded-lg text-sm font-semibold px-4 py-2 transition-opacity hover:opacity-90"
      style="background: var(--app-accent); color: #fff"
    >
      Back to Apply
    </NuxtLink>
  </div>
</template>
