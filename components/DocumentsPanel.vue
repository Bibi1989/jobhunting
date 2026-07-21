<script setup lang="ts">
import { Upload, FileText, Loader2, Trash2 } from 'lucide-vue-next'
import type { UserDocumentSummary } from '~/shared/types/job'

const props = defineProps<{
  resume: UserDocumentSummary | null
  coverLetter: UserDocumentSummary | null
}>()

const emit = defineEmits<{
  uploaded: []
  removed: []
}>()

const uploading = ref<'resume' | 'cover_letter' | null>(null)
const removing = ref<'resume' | 'cover_letter' | null>(null)
const error = ref<string | null>(null)

async function onFileChange(event: Event, type: 'resume' | 'cover_letter') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = type
  error.value = null

  try {
    const form = new FormData()
    form.append('type', type)
    form.append('file', file)

    await $fetch('/api/documents', {
      method: 'POST',
      body: form,
    })

    emit('uploaded')
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value =
      fetchError.data?.statusMessage || fetchError.message || 'Upload failed'
  } finally {
    uploading.value = null
    input.value = ''
  }
}

async function removeDocument(type: 'resume' | 'cover_letter') {
  const { confirm } = useAppConfirm()
  const label = type === 'resume' ? 'resume / CV' : 'cover letter'
  const confirmed = await confirm({
    title: `Remove ${label}`,
    message: `Delete your uploaded ${label}? This cannot be undone.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!confirmed) return

  removing.value = type
  error.value = null
  try {
    await $fetch('/api/documents', {
      method: 'DELETE',
      body: { type },
    })
    emit('removed')
    emit('uploaded')
  } catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; message?: string }
    error.value =
      fetchError.data?.statusMessage || fetchError.message || 'Remove failed'
  } finally {
    removing.value = null
  }
}
</script>

<template>
  <div class="flex flex-col md:flex-row gap-6 md:gap-10 w-full">
    <div class="md:w-1/3 shrink-0 flex flex-col gap-2">
      <h3 class="text-xs font-bold uppercase text-indigo-400 tracking-widest select-none">Your Documents</h3>
      <p class="text-[11px] text-slate-500 leading-relaxed select-none">
        Upload a CV and cover letter (PDF, DOCX, or TXT) to auto-fill details and customize materials.
      </p>
    </div>

    <div class="flex-1 space-y-4 min-w-0">
      <div>
        <span class="text-[11px] text-slate-400 font-bold mb-2 block select-none">Resume / CV</span>
        <div class="flex items-center gap-2">
          <label
            class="flex-1 flex items-center justify-between gap-3 px-4 py-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-xs text-slate-300 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-300 select-none group"
            :class="{ 'opacity-65 pointer-events-none': uploading === 'resume' || removing === 'resume' }"
          >
            <input type="file" class="hidden" accept=".pdf,.doc,.docx,.txt" @change="onFileChange($event, 'resume')" />
            <div class="flex items-center gap-2.5 min-w-0">
              <Upload :size="14" class="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
              <span class="truncate font-medium group-hover:text-slate-200 transition-colors">
                {{
                  uploading === 'resume'
                    ? 'Uploading...'
                    : resume?.originalName || 'Upload PDF, DOCX or TXT'
                }}
              </span>
            </div>
            <span class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider group-hover:text-indigo-300 shrink-0" v-if="!resume && uploading !== 'resume'">Browse</span>
          </label>
          <Loader2 v-if="uploading === 'resume' || removing === 'resume'" class="animate-spin text-indigo-400 shrink-0" :size="16" />
          <FileText v-else-if="resume" class="text-emerald-400 shrink-0" :size="16" />
          <button
            v-if="resume"
            type="button"
            title="Remove CV"
            class="p-3 rounded-2xl border border-slate-850 text-slate-400 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 disabled:opacity-50 shrink-0"
            :disabled="!!uploading || !!removing"
            @click="removeDocument('resume')"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>

      <div>
        <span class="text-[11px] text-slate-400 font-bold mb-2 block select-none">Cover Letter</span>
        <div class="flex items-center gap-2">
          <label
            class="flex-1 flex items-center justify-between gap-3 px-4 py-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-xs text-slate-300 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-300 select-none group"
            :class="{ 'opacity-65 pointer-events-none': uploading === 'cover_letter' || removing === 'cover_letter' }"
          >
            <input type="file" class="hidden" accept=".pdf,.doc,.docx,.txt" @change="onFileChange($event, 'cover_letter')" />
            <div class="flex items-center gap-2.5 min-w-0">
              <Upload :size="14" class="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
              <span class="truncate font-medium group-hover:text-slate-200 transition-colors">
                {{
                  uploading === 'cover_letter'
                    ? 'Uploading...'
                    : coverLetter?.originalName || 'Upload PDF, DOCX or TXT'
                }}
              </span>
            </div>
            <span class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider group-hover:text-indigo-300 shrink-0" v-if="!coverLetter && uploading !== 'cover_letter'">Browse</span>
          </label>
          <Loader2
            v-if="uploading === 'cover_letter' || removing === 'cover_letter'"
            class="animate-spin text-indigo-400 shrink-0"
            :size="16"
          />
          <FileText v-else-if="coverLetter" class="text-emerald-400 shrink-0" :size="16" />
          <button
            v-if="coverLetter"
            type="button"
            title="Remove cover letter"
            class="p-3 rounded-2xl border border-slate-850 text-slate-400 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 disabled:opacity-50 shrink-0"
            :disabled="!!uploading || !!removing"
            @click="removeDocument('cover_letter')"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" class="text-xs text-red-400 mt-2 bg-red-950/20 border border-red-500/20 rounded-xl px-3 py-2">{{ error }}</p>
  </div>
</template>
