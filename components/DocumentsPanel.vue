<script setup lang="ts">
import { Upload, Loader2, Trash2, FileCheck } from 'lucide-vue-next'
import type { UserDocumentSummary } from '~/shared/types/job'

const { t } = useI18n()

defineProps<{
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
      fetchError.data?.statusMessage || fetchError.message || t('documents.uploadFailed')
  } finally {
    uploading.value = null
    input.value = ''
  }
}

async function removeDocument(type: 'resume' | 'cover_letter') {
  const { confirm } = useAppConfirm()
  const label = type === 'resume' ? t('documents.labelResume') : t('documents.labelCoverLetter')
  const confirmed = await confirm({
    title: t('documents.removeConfirmTitle', { type: label }),
    message: t('documents.removeConfirmMessage', { type: label }),
    confirmLabel: t('common.delete'),
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
      fetchError.data?.statusMessage || fetchError.message || t('documents.removeFailed')
  } finally {
    removing.value = null
  }
}

function rowState(type: 'resume' | 'cover_letter', doc: UserDocumentSummary | null) {
  const busy = uploading.value === type || removing.value === type
  return {
    busy,
    label: busy
      ? (removing.value === type ? t('documents.removing') : t('documents.uploading'))
      : doc?.originalName || t('documents.uploadHelpMax'),
    hasDoc: !!doc,
  }
}
</script>

<template>
  <div class="w-full min-w-0 space-y-4">
    <div>
      <h3 class="text-xs font-bold uppercase text-indigo-400 tracking-widest select-none">
        {{ t('documents.title') }}
      </h3>
      <p class="mt-2 text-[11px] text-slate-500 leading-relaxed select-none">
        {{ t('documents.introHelp') }}
      </p>
    </div>

    <div class="space-y-4 min-w-0">
      <!-- Resume -->
      <div class="min-w-0">
        <span class="text-[11px] text-slate-400 font-bold mb-2 block select-none">{{ t('documents.resumeCv') }}</span>
        <div class="flex items-stretch gap-2 min-w-0">
          <label
            class="min-w-0 flex-1 flex items-center gap-2.5 px-3 py-2.5 bg-slate-950/40 border rounded-xl text-xs cursor-pointer transition-all duration-300 select-none group"
            :class="[
              rowState('resume', resume).hasDoc
                ? 'border-emerald-500/30 hover:border-emerald-500/50'
                : 'border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/60',
              rowState('resume', resume).busy ? 'opacity-65 pointer-events-none' : '',
            ]"
          >
            <input type="file" class="hidden" accept=".pdf,.doc,.docx,.txt" @change="onFileChange($event, 'resume')" />
            <Loader2 v-if="rowState('resume', resume).busy" class="animate-spin text-indigo-400 shrink-0" :size="14" />
            <FileCheck v-else-if="resume" class="text-emerald-400 shrink-0" :size="14" />
            <Upload v-else :size="14" class="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
            <span
              class="min-w-0 flex-1 truncate font-medium transition-colors"
              :class="resume ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-200'"
            >
              {{ rowState('resume', resume).label }}
            </span>
            <span
              v-if="!resume && !rowState('resume', resume).busy"
              class="shrink-0 text-[10px] text-indigo-400 font-bold uppercase tracking-wider"
            >
              {{ t('documents.browse') }}
            </span>
          </label>
          <button
            v-if="resume"
            type="button"
            :title="t('documents.removeCvTitle')"
            class="shrink-0 p-2.5 rounded-xl border border-slate-850 text-slate-400 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 disabled:opacity-50"
            :disabled="!!uploading || !!removing"
            @click="removeDocument('resume')"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>

      <!-- Cover letter -->
      <div class="min-w-0">
        <span class="text-[11px] text-slate-400 font-bold mb-2 block select-none">{{ t('documents.coverLetter') }}</span>
        <div class="flex items-stretch gap-2 min-w-0">
          <label
            class="min-w-0 flex-1 flex items-center gap-2.5 px-3 py-2.5 bg-slate-950/40 border rounded-xl text-xs cursor-pointer transition-all duration-300 select-none group"
            :class="[
              rowState('cover_letter', coverLetter).hasDoc
                ? 'border-emerald-500/30 hover:border-emerald-500/50'
                : 'border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/60',
              rowState('cover_letter', coverLetter).busy ? 'opacity-65 pointer-events-none' : '',
            ]"
          >
            <input type="file" class="hidden" accept=".pdf,.doc,.docx,.txt" @change="onFileChange($event, 'cover_letter')" />
            <Loader2 v-if="rowState('cover_letter', coverLetter).busy" class="animate-spin text-indigo-400 shrink-0" :size="14" />
            <FileCheck v-else-if="coverLetter" class="text-emerald-400 shrink-0" :size="14" />
            <Upload v-else :size="14" class="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
            <span
              class="min-w-0 flex-1 truncate font-medium transition-colors"
              :class="coverLetter ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-200'"
            >
              {{ rowState('cover_letter', coverLetter).label }}
            </span>
            <span
              v-if="!coverLetter && !rowState('cover_letter', coverLetter).busy"
              class="shrink-0 text-[10px] text-indigo-400 font-bold uppercase tracking-wider"
            >
              {{ t('documents.browse') }}
            </span>
          </label>
          <button
            v-if="coverLetter"
            type="button"
            :title="t('documents.removeCoverTitle')"
            class="shrink-0 p-2.5 rounded-xl border border-slate-850 text-slate-400 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 disabled:opacity-50"
            :disabled="!!uploading || !!removing"
            @click="removeDocument('cover_letter')"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <p
      v-if="error"
      class="text-xs text-red-400 bg-red-950/20 border border-red-500/20 rounded-xl px-3 py-2"
    >
      {{ error }}
    </p>
  </div>
</template>
