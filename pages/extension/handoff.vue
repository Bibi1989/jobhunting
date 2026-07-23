<script setup lang="ts">
/**
 * Bridge for the JobFlow Chrome extension.
 * Extension opens this origin page, injects sessionStorage prefill, then we
 * forward to the resume builder (same pattern as /apply → builder).
 */
import { persistApplyPrefill } from '~/utils/builderJobPrefill'

definePageMeta({
  layout: false,
})

const { t } = useI18n()

useHead({ title: () => t('extensionHandoff.pageTitle') })

const status = ref('')
const error = ref('')

onMounted(async () => {
  if (!import.meta.client) return

  status.value = t('extensionHandoff.waiting')

  const deadline = Date.now() + 8000
  while (Date.now() < deadline) {
    try {
      const raw = sessionStorage.getItem('builder-apply-prefill')
      if (raw) {
        const parsed = JSON.parse(raw) as {
          description?: string
          title?: string
          resumeName?: string
        }
        if (parsed.description && parsed.description.trim().length >= 40) {
          persistApplyPrefill({
            description: parsed.description.trim(),
            title: parsed.title || '',
            resumeName: parsed.resumeName || '',
            resumeFile: null,
          })
          status.value = t('extensionHandoff.opening')
          await navigateTo('/builder/resume/new?from=chrome-extension')
          return
        }
      }
    } catch {
      /* keep polling */
    }
    await new Promise((r) => setTimeout(r, 150))
  }

  error.value = t('extensionHandoff.errorNoDescription')
  status.value = t('extensionHandoff.timedOut')
})
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-100 px-6 text-center">
    <div
      class="w-10 h-10 rounded-full border-2 border-indigo-400/40 border-t-indigo-400 animate-spin"
      aria-hidden="true"
    />
    <p class="text-sm font-medium text-slate-200">{{ status }}</p>
    <p v-if="error" class="text-sm text-rose-300 max-w-md">{{ error }}</p>
    <NuxtLink
      v-if="error"
      to="/builder/resume/new"
      class="mt-2 text-sm text-indigo-300 underline underline-offset-2"
    >
      {{ t('extensionHandoff.openManually') }}
    </NuxtLink>
  </div>
</template>
