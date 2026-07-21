<script setup lang="ts">
/**
 * Live A4 canvas — renders via the same Nitro @react-pdf pipeline as Download.
 * Avoids bundling @ceereals/vue-pdf / base64-js in Vite (CJS default-export 500).
 */
import { ref, watch, onBeforeUnmount } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { BuilderResumeData } from '~/shared/types/builder'
import {
  normalizeSectionsOrder,
  resolveTemplateSlug,
  withLayoutState,
} from '~/shared/pdf/schema'

const props = defineProps<{
  resume: BuilderResumeData
}>()

const url = ref('')
const loading = ref(false)
const error = ref('')

async function refreshPreview() {
  loading.value = true
  error.value = ''
  try {
    const layout = withLayoutState(props.resume)
    const templateSlug = resolveTemplateSlug(layout)
    const sectionsOrder = normalizeSectionsOrder(
      layout.sectionsOrder,
      layout.customSections || [],
    )

    const response = await fetch('/api/pdf/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/pdf',
      },
      body: JSON.stringify({
        kind: 'resume',
        filename: 'preview.pdf',
        resume: {
          ...layout,
          templateSlug,
          templateId: layout.templateId || templateSlug,
          sectionsOrder,
        },
        templateSlug,
        sectionsOrder,
      }),
    })

    if (!response.ok) {
      throw new Error('PDF preview failed')
    }

    const blob = await response.blob()
    const next = URL.createObjectURL(blob)
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = next
  } catch (e) {
    console.error(e)
    error.value = e instanceof Error ? e.message : 'Preview failed'
  } finally {
    loading.value = false
  }
}

const debouncedRefresh = useDebounceFn(refreshPreview, 450)

watch(
  () => props.resume,
  () => {
    void debouncedRefresh()
  },
  { deep: true, immediate: true },
)

onBeforeUnmount(() => {
  if (url.value) URL.revokeObjectURL(url.value)
})
</script>

<template>
  <div class="resume-pdf-preview relative w-full min-w-0 max-w-[240mm] mx-auto min-h-[842px] bg-white shadow-2xl rounded-sm overflow-hidden">
    <div
      v-if="loading"
      class="absolute inset-x-0 top-0 z-10 flex justify-center pointer-events-none"
    >
      <span class="mt-3 text-[11px] uppercase tracking-wider text-slate-500 bg-white/90 px-2 py-1 rounded shadow-sm">
        Updating preview…
      </span>
    </div>
    <div
      v-if="error && !url"
      class="flex items-center justify-center min-h-[420px] text-sm text-red-600 px-4 text-center"
    >
      {{ error }}
    </div>
    <iframe
      v-if="url"
      :src="url"
      title="Resume PDF preview"
      class="w-full min-h-[842px] border-0 bg-white"
    />
  </div>
</template>
