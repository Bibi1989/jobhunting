<script setup lang="ts">
import { Mail, Trash2, Pencil, Play } from 'lucide-vue-next'
import {
  deleteApplyEmailTemplate,
  loadApplyEmailTemplates,
  type ApplyEmailTemplate,
} from '~/utils/applyEmailTemplates'

const emit = defineEmits<{
  use: [template: ApplyEmailTemplate]
  edit: [template: ApplyEmailTemplate]
}>()

const { t, locale } = useI18n()
const { sessionUser } = useSaaS()
const toast = useAppToast()
const { confirm } = useAppConfirm()

const templates = ref<ApplyEmailTemplate[]>([])

function reload() {
  templates.value = loadApplyEmailTemplates(sessionUser.value?.id)
}

onMounted(reload)

defineExpose({ reload })

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(locale.value === 'de' ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

async function removeTemplate(tpl: ApplyEmailTemplate) {
  const ok = await confirm({
    title: t('applyEmail.deleteTitle'),
    message: t('applyEmail.deleteMessage', { name: tpl.name }),
    confirmLabel: t('applyEmail.deleteConfirm'),
    danger: true,
  })
  if (!ok) return
  templates.value = deleteApplyEmailTemplate(tpl.id, sessionUser.value?.id)
  toast.success(t('applyEmail.deleted'))
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="!templates.length" class="rounded-xl border border-dashed border-slate-700 bg-slate-950/30 p-10 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-4">
        <Mail :size="22" />
      </div>
      <p class="text-sm text-slate-300 font-semibold mb-1">{{ t('applyEmail.noSavedYet') }}</p>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        {{ t('applyEmail.noSavedHelp') }}
      </p>
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="tpl in templates"
        :key="tpl.id"
        class="rounded-xl border border-slate-800 bg-slate-950/40 p-4 hover:border-emerald-500/30 transition-colors"
      >
        <div class="flex flex-col sm:flex-row sm:items-start gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-bold text-white truncate">{{ tpl.name }}</h3>
            <p v-if="tpl.jobTitle" class="text-xs text-emerald-400/90 mt-0.5 truncate">{{ tpl.jobTitle }}</p>
            <p class="text-xs text-slate-400 mt-1 truncate">{{ t('applyEmail.subjectLabel', { subject: tpl.subject || '—' }) }}</p>
            <p class="text-[10px] text-slate-500 mt-2">{{ t('applyEmail.updated', { date: formatDate(tpl.updatedAt) }) }}</p>
          </div>
          <div class="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              @click="emit('use', tpl)"
            >
              <Play :size="12" />
              {{ t('applyEmail.use') }}
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              @click="emit('edit', tpl)"
            >
              <Pencil :size="12" />
              {{ t('applyEmail.edit') }}
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/40 text-xs cursor-pointer"
              :title="t('applyEmail.delete')"
              @click="removeTemplate(tpl)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
