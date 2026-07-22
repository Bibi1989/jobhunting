<script setup lang="ts">
type BuilderDocumentPreview = {
  kind: 'resume' | 'cover_letter'
  fullName: string
  jobTitle: string
  location: string
  email: string
  phone: string
  summary: string
  experience: Array<{ title: string; company: string; dates: string }>
  skills: string[]
  companyName?: string
  hiringManager?: string
  contentPreview?: string
}

type BuilderDocCard = {
  id: string
  type: string
  name: string
  updatedAt: string
  templateId: string
  isFavorite?: boolean
  preview: BuilderDocumentPreview | null
}

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const toast = useAppToast()
const { confirm } = useAppConfirm()
const { isPro, isAdmin } = useSaaS()
const { data: documents, pending, refresh } = useFetch<BuilderDocCard[]>('/api/builder/documents')
const deletingKey = ref<string | null>(null)
const favoritingKey = ref<string | null>(null)
const showFavoritesOnly = ref(false)

const unlimitedProjects = computed(() => isPro.value || isAdmin.value)
const hasResume = computed(() => (documents.value || []).some((d) => d.type === 'resume'))
const hasCoverLetter = computed(() => (documents.value || []).some((d) => d.type === 'cover_letter'))
const canCreateResume = computed(() => unlimitedProjects.value || !hasResume.value)
const canCreateCoverLetter = computed(() => unlimitedProjects.value || !hasCoverLetter.value)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

const activeFilter = ref<'all' | 'resume' | 'cover_letter'>('all')

const visibleDocuments = computed(() => {
  let list = documents.value || []
  if (showFavoritesOnly.value) {
    list = list.filter((d) => d.isFavorite)
  }
  if (activeFilter.value === 'resume') {
    return list.filter((d) => d.type === 'resume')
  }
  if (activeFilter.value === 'cover_letter') {
    return list.filter((d) => d.type === 'cover_letter')
  }
  return list
})

async function toggleFavorite(doc: BuilderDocCard) {
  const key = `${doc.type}-${doc.id}`
  favoritingKey.value = key
  const next = !doc.isFavorite
  try {
    await $fetch(`/api/builder/documents/${doc.id}/favorite`, {
      method: 'PATCH',
      body: { type: doc.type, isFavorite: next },
    })
    doc.isFavorite = next
    toast.success(next ? 'Added to favorites.' : 'Removed from favorites.')
    await refresh()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Could not update favorite.')
  } finally {
    favoritingKey.value = null
  }
}

async function deleteDocument(doc: BuilderDocCard) {
  const label = doc.type === 'cover_letter' ? 'cover letter' : 'resume'
  const confirmed = await confirm({
    title: `Delete ${label}`,
    message: `Delete “${doc.name}”? This cannot be undone.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!confirmed) return

  const key = `${doc.type}-${doc.id}`
  deletingKey.value = key
  try {
    await $fetch(`/api/builder/documents/${doc.id}`, {
      method: 'DELETE',
      query: { type: doc.type },
    })
    toast.success(`${label.charAt(0).toUpperCase()}${label.slice(1)} deleted.`)
    await refresh()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Failed to delete document.')
  } finally {
    deletingKey.value = null
  }
}

</script>

<template>
  <div class="pt-8 pb-12 px-6 text-app-fg">
      <div class="max-w-7xl mx-auto">
        <header class="mb-8">
          <h1 class="font-serif text-4xl text-app-fg mb-2">Workspace</h1>
          <div class="w-full h-px bg-app-border mb-8"></div>
        </header>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <NuxtLink
            v-if="canCreateResume"
            to="/builder/resume/new"
            class="group relative flex flex-col items-center justify-center h-64 bg-app-input backdrop-blur-md border-2 border-dashed border-app-border rounded-xl hover:border-blue-400 hover:bg-app-panel transition-all cursor-pointer"
          >
            <div class="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <span class="material-symbols-outlined">add</span>
            </div>
            <span class="font-semibold text-app-fg">New Resume</span>
            <span class="text-sm text-app-muted mt-1">Start from professional templates</span>
          </NuxtLink>
          <div
            v-else
            class="relative flex flex-col items-center justify-center h-64 bg-app-input backdrop-blur-md border-2 border-dashed border-app-border rounded-xl opacity-90"
          >
            <div class="w-12 h-12 rounded-full bg-app-border text-app-muted flex items-center justify-center mb-4">
              <span class="material-symbols-outlined">lock</span>
            </div>
            <span class="font-semibold text-app-fg">Resume limit reached</span>
            <span class="text-sm text-app-muted mt-1 text-center px-6">Free plan allows 1 resume. Edit yours below, or upgrade for unlimited.</span>
            <NuxtLink to="/pricing" class="mt-3 text-sm font-semibold text-indigo-500 hover:text-indigo-400 underline underline-offset-2">
              Upgrade to Pro
            </NuxtLink>
          </div>

          <NuxtLink
            v-if="canCreateCoverLetter"
            to="/builder/cover-letter/new"
            class="group relative flex flex-col items-center justify-center h-64 bg-app-input backdrop-blur-md border-2 border-dashed border-app-border rounded-xl hover:border-indigo-400 hover:bg-app-panel transition-all cursor-pointer"
          >
            <div class="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <span class="material-symbols-outlined">description</span>
            </div>
            <span class="font-semibold text-app-fg">New Cover Letter</span>
            <span class="text-sm text-app-muted mt-1">AI-powered writing assistant</span>
          </NuxtLink>
          <div
            v-else
            class="relative flex flex-col items-center justify-center h-64 bg-app-input backdrop-blur-md border-2 border-dashed border-app-border rounded-xl opacity-90"
          >
            <div class="w-12 h-12 rounded-full bg-app-border text-app-muted flex items-center justify-center mb-4">
              <span class="material-symbols-outlined">lock</span>
            </div>
            <span class="font-semibold text-app-fg">Cover letter limit reached</span>
            <span class="text-sm text-app-muted mt-1 text-center px-6">Free plan allows 1 cover letter. Edit yours below, or upgrade for unlimited.</span>
            <NuxtLink to="/pricing" class="mt-3 text-sm font-semibold text-indigo-500 hover:text-indigo-400 underline underline-offset-2">
              Upgrade to Pro
            </NuxtLink>
          </div>

          <div class="h-64 bg-blue-500/10 backdrop-blur-md border border-blue-500/25 text-app-fg p-6 rounded-xl flex flex-col justify-between overflow-hidden relative shadow-sm">
            <div class="z-10">
              <p class="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-300 mb-2 font-semibold">Total Documents</p>
              <p class="font-serif text-4xl text-app-fg">{{ documents?.length || 0 }} Projects</p>
              <p class="text-sm text-app-muted mt-2">
                {{ documents?.filter((d) => d.isFavorite).length || 0 }} favorites
              </p>
            </div>
            <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: radial-gradient(#60a5fa 1px, transparent 1px); background-size: 20px 20px;"></div>
            <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
          </div>
        </section>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 pb-4 border-b border-app-border">
          <div class="flex flex-wrap items-center gap-6">
            <h2 class="font-semibold uppercase tracking-widest text-app-muted text-sm">Recent Projects</h2>
            <div class="flex bg-app-input p-1 rounded-xl border border-app-border">
              <button
                v-for="tab in ([{ id: 'all', label: 'All' }, { id: 'resume', label: 'Resumes' }, { id: 'cover_letter', label: 'Cover Letters' }] as const)"
                :key="tab.id"
                type="button"
                class="px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer"
                :class="activeFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-panel'"
                @click="activeFilter = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition self-end sm:self-auto"
            :class="showFavoritesOnly
              ? 'border-amber-400/50 bg-amber-500/15 text-amber-700 dark:text-amber-200'
              : 'border-app-border text-app-muted hover:bg-app-input hover:text-app-fg'"
            @click="showFavoritesOnly = !showFavoritesOnly"
          >
            <span class="material-symbols-outlined text-[16px]" :class="showFavoritesOnly ? 'fill-current' : ''">star</span>
            {{ showFavoritesOnly ? 'Favorites only' : 'Show favorites' }}
          </button>
        </div>

        <section v-if="pending" class="text-app-muted">
          <div class="animate-pulse flex gap-2 items-center">
             <span class="material-symbols-outlined animate-spin">refresh</span> Loading documents...
          </div>
        </section>
        
        <section v-else-if="!visibleDocuments.length" class="text-app-muted italic">
          {{ showFavoritesOnly ? 'No favorites yet. Star a resume or cover letter.' : 'No documents found. Create a new resume above.' }}
        </section>

        <section v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <NuxtLink
            v-for="doc in visibleDocuments"
            :key="`${doc.type}-${doc.id}`"
            :to="`/builder/${doc.type === 'cover_letter' ? 'cover-letter' : 'resume'}/${doc.id}`"
            class="group bg-app-panel border border-app-border rounded-xl overflow-hidden flex flex-col hover:shadow-lg hover:border-blue-400/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div class="relative aspect-[3/4] bg-app-input p-3 overflow-hidden border-b border-app-border">
              <BuilderDocumentThumbnail :preview="doc.preview" :type="doc.type" />
              <button
                type="button"
                class="absolute top-3 right-3 z-10 rounded-full bg-app-bg-elevated/90 border border-app-border p-1.5 text-amber-500 hover:bg-app-panel disabled:opacity-40"
                :title="doc.isFavorite ? 'Remove favorite' : 'Add favorite'"
                :disabled="favoritingKey === `${doc.type}-${doc.id}`"
                @click.prevent.stop="toggleFavorite(doc)"
              >
                <span
                  class="material-symbols-outlined text-[18px]"
                  :style="doc.isFavorite ? 'font-variation-settings: \'FILL\' 1' : ''"
                >star</span>
              </button>
            </div>
            <div class="p-4">
              <div class="flex justify-between items-start mb-2 gap-2">
                <h3 class="font-semibold text-app-fg truncate pr-2 group-hover:text-blue-500 transition-colors">{{ doc.name }}</h3>
                <button
                  type="button"
                  class="shrink-0 text-app-muted hover:text-red-500 material-symbols-outlined text-[18px] cursor-pointer disabled:opacity-40 z-10"
                  title="Delete"
                  :disabled="deletingKey === `${doc.type}-${doc.id}`"
                  @click.prevent.stop="deleteDocument(doc)"
                >
                  delete
                </button>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] bg-app-input px-2 py-0.5 rounded text-app-muted uppercase font-semibold tracking-wider border border-app-border">{{ doc.type }}</span>
                <span class="text-xs text-app-muted">Edited {{ formatDate(doc.updatedAt) }}</span>
              </div>
            </div>
          </NuxtLink>
        </section>
      </div>
  </div>
</template>
