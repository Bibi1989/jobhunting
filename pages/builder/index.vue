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
  preview: BuilderDocumentPreview | null
}

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const toast = useAppToast()
const { confirm } = useAppConfirm()
const { data: documents, pending, refresh } = useFetch<BuilderDocCard[]>('/api/builder/documents')
const deletingKey = ref<string | null>(null)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
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
  <div class="pt-8 pb-12 px-6">
      <div class="max-w-7xl mx-auto">
        <header class="mb-8">
          <h1 class="font-serif text-4xl text-white mb-2">Workspace</h1>
          <div class="w-full h-px bg-white/10 mb-8"></div>
        </header>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <NuxtLink to="/builder/resume/new" class="group relative flex flex-col items-center justify-center h-64 bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 rounded-xl hover:border-blue-400 hover:bg-white/10 transition-all cursor-pointer">
            <div class="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <span class="material-symbols-outlined">add</span>
            </div>
            <span class="font-semibold text-white">New Resume</span>
            <span class="text-sm text-blue-200/60 mt-1">Start from professional templates</span>
          </NuxtLink>

          <NuxtLink to="/builder/cover-letter/new" class="group relative flex flex-col items-center justify-center h-64 bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 rounded-xl hover:border-indigo-400 hover:bg-white/10 transition-all cursor-pointer">
            <div class="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <span class="material-symbols-outlined">description</span>
            </div>
            <span class="font-semibold text-white">New Cover Letter</span>
            <span class="text-sm text-blue-200/60 mt-1">AI-powered writing assistant</span>
          </NuxtLink>

          <div class="h-64 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 text-white p-6 rounded-xl flex flex-col justify-between overflow-hidden relative shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div class="z-10">
              <p class="text-xs uppercase tracking-widest text-blue-300 mb-2 font-semibold">Total Documents</p>
              <p class="font-serif text-4xl">{{ documents?.length || 0 }} Projects</p>
            </div>
            <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: radial-gradient(#60a5fa 1px, transparent 1px); background-size: 20px 20px;"></div>
            <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl"></div>
          </div>
        </section>

        <div class="flex items-center justify-between mb-6">
          <h2 class="font-semibold uppercase tracking-widest text-blue-200/60 text-sm">Recent Projects</h2>
        </div>

        <section v-if="pending" class="text-blue-200/60">
          <div class="animate-pulse flex gap-2 items-center">
             <span class="material-symbols-outlined animate-spin">refresh</span> Loading documents...
          </div>
        </section>
        
        <section v-else-if="!documents?.length" class="text-blue-200/60 italic">
          No documents found. Create a new resume above.
        </section>

        <section v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <NuxtLink
            v-for="doc in documents"
            :key="`${doc.type}-${doc.id}`"
            :to="`/builder/${doc.type === 'cover_letter' ? 'cover-letter' : 'resume'}/${doc.id}`"
            class="group bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-blue-400/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div class="relative aspect-[3/4] bg-slate-800/40 p-3 overflow-hidden border-b border-white/5">
              <BuilderDocumentThumbnail :preview="doc.preview" :type="doc.type" />
            </div>
            <div class="p-4">
              <div class="flex justify-between items-start mb-2 gap-2">
                <h3 class="font-semibold text-white truncate pr-2 group-hover:text-blue-400 transition-colors">{{ doc.name }}</h3>
                <button
                  type="button"
                  class="shrink-0 text-slate-500 hover:text-red-400 material-symbols-outlined text-[18px] cursor-pointer disabled:opacity-40 z-10"
                  title="Delete"
                  :disabled="deletingKey === `${doc.type}-${doc.id}`"
                  @click.prevent.stop="deleteDocument(doc)"
                >
                  delete
                </button>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-blue-200 uppercase font-semibold tracking-wider">{{ doc.type }}</span>
                <span class="text-xs text-slate-400">Edited {{ formatDate(doc.updatedAt) }}</span>
              </div>
            </div>
          </NuxtLink>
        </section>
      </div>
  </div>
</template>
