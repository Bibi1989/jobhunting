<script setup lang="ts">
/**
 * Live A4 cover-letter preview — same Nitro @react-pdf pipeline as Export PDF.
 * Keeps preview identical to download (fixed A4 pages, no HTML paper-fill growth).
 */
import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { BuilderCoverLetter, BuilderResumeData } from '~/shared/types/builder'
import { withLayoutState } from '~/shared/pdf/schema'

const props = defineProps<{
  resume: BuilderResumeData
  coverLetter: BuilderCoverLetter
}>()

const url = ref('')
const loading = ref(false)
const error = ref('')

const blobCache = new Map<string, string>()

function getCacheKey() {
  return JSON.stringify(previewPayload.value)
}

function addToCache(key: string, blobUrl: string) {
  if (blobCache.size > 20) {
    const firstKey = blobCache.keys().next().value
    if (firstKey) {
      const firstUrl = blobCache.get(firstKey)
      if (firstUrl) URL.revokeObjectURL(firstUrl)
      blobCache.delete(firstKey)
    }
  }
  blobCache.set(key, blobUrl)
}

const previewPayload = computed(() => {
  const layout = withLayoutState({
    ...props.resume,
    coverLetter: props.coverLetter,
    templateId: props.resume.templateId || props.resume.templateSlug || 'cl-standard',
    templateSlug: props.resume.templateId || props.resume.templateSlug || 'cl-standard',
  })
  return {
    kind: 'cover_letter' as const,
    filename: 'cover-letter-preview.pdf',
    resume: layout,
    coverLetter: props.coverLetter,
    templateSlug: layout.templateId || layout.templateSlug,
  }
})

async function refreshPreview() {
  const cacheKey = getCacheKey()
  if (blobCache.has(cacheKey)) {
    const cachedUrl = blobCache.get(cacheKey)!
    if (url.value !== cachedUrl) {
      url.value = cachedUrl
    }
    return
  }

  loading.value = true
  error.value = ''
  try {
    const response = await fetch('/api/pdf/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/pdf',
      },
      body: JSON.stringify(previewPayload.value),
    })

    if (!response.ok) {
      throw new Error('PDF preview failed')
    }

    const blob = await response.blob()
    const next = URL.createObjectURL(blob)
    addToCache(cacheKey, next)
    url.value = next
  } catch (e) {
    console.error(e)
    error.value = e instanceof Error ? e.message : 'Preview failed'
  } finally {
    loading.value = false
  }
}

let refreshTimeout: any = null

function triggerRefresh() {
  if (refreshTimeout) clearTimeout(refreshTimeout)
  const active = typeof document !== 'undefined' ? document.activeElement : null
  const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
  const delay = isTyping ? 2500 : 450
  refreshTimeout = setTimeout(() => {
    void refreshPreview()
  }, delay)
}

watch(
  previewPayload,
  () => {
    triggerRefresh()
  },
  { deep: true, immediate: true },
)

onBeforeUnmount(() => {
  if (refreshTimeout) clearTimeout(refreshTimeout)
  for (const blobUrl of blobCache.values()) {
    URL.revokeObjectURL(blobUrl)
  }
  blobCache.clear()
  if (url.value) URL.revokeObjectURL(url.value)
})
</script>

<template>
  <div class="cover-letter-pdf-preview relative w-full min-w-0 max-w-[240mm] mx-auto min-h-[842px] bg-white shadow-2xl rounded-sm overflow-hidden">
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
      title="Cover letter PDF preview"
      class="w-full min-h-[842px] h-[1123px] border-0 bg-white"
    />
  </div>
</template>
