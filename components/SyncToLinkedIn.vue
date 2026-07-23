<script setup lang="ts">
import { jsPDF } from 'jspdf'
import type { BuilderExperience } from '~/shared/types/builder'
import { builderExperienceToLinkedInPayload } from '~/shared/linkedinExperience'

const props = defineProps<{
  experience: Pick<
    BuilderExperience,
    'title' | 'company' | 'location' | 'startDate' | 'endDate' | 'isCurrent' | 'description'
  >
  /** Optional: parent full-resume PDF export. Falls back to a single-role PDF. */
  pdfExport?: () => void | Promise<void>
}>()

const { t } = useI18n()
const toast = useAppToast()
const {
  extensionInstalled,
  toPayload,
  autoFillOnLinkedIn,
  copyExperienceBullets,
  downloadExperienceJson,
  openLinkedInPositionForm,
} = useLinkedInSync()

const busy = ref(false)
const payload = computed(() => toPayload(props.experience))

async function onAutoFill() {
  if (busy.value) return
  busy.value = true
  try {
    await autoFillOnLinkedIn(payload.value)
  } finally {
    busy.value = false
  }
}

async function onCopy() {
  if (busy.value) return
  busy.value = true
  try {
    await copyExperienceBullets(payload.value)
  } finally {
    busy.value = false
  }
}

function onDownloadJson() {
  const base = [payload.value.company, payload.value.title]
    .filter(Boolean)
    .join('-')
    .replace(/[^\w.-]+/g, '-')
    .slice(0, 60) || 'linkedin-experience'
  downloadExperienceJson(payload.value, base)
}

async function downloadExperiencePdf() {
  const p = payload.value
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const margin = 48
  let y = margin
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(p.title || 'Experience', margin, y)
  y += 20

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const subtitle = [p.company, p.location].filter(Boolean).join(' · ')
  if (subtitle) {
    doc.text(subtitle, margin, y)
    y += 16
  }

  const dateLine = formatDateLine(p)
  if (dateLine) {
    doc.setTextColor(100)
    doc.text(dateLine, margin, y)
    doc.setTextColor(0)
    y += 20
  }

  y += 8
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(p.description || '', maxWidth)
  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(line, margin, y)
    y += 14
  }

  const filename = [p.company, p.title].filter(Boolean).join('-').replace(/[^\w.-]+/g, '-') || 'experience'
  doc.save(`${filename.slice(0, 60)}.pdf`)
  toast.success(t('linkedinSync.pdfDownloaded'))
}

async function onDownloadPdf() {
  if (busy.value) return
  busy.value = true
  try {
    if (props.pdfExport) {
      await props.pdfExport()
    } else {
      await downloadExperiencePdf()
    }
  } catch {
    toast.error(t('linkedinSync.pdfFailed'))
  } finally {
    busy.value = false
  }
}

function formatDateLine(
  p: ReturnType<typeof builderExperienceToLinkedInPayload>,
): string {
  const fmt = (d: { month: number; year: number } | null) =>
    d ? `${String(d.month).padStart(2, '0')}/${d.year}` : ''
  const start = fmt(p.startDate)
  const end = p.isCurrent ? 'Present' : fmt(p.endDate)
  if (!start && !end) return ''
  return `${start || '?'} – ${end || '?'}`
}
</script>

<template>
  <div
    class="linkedin-sync mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
    role="group"
    :aria-label="t('linkedinSync.groupLabel')"
  >
    <div class="flex items-center gap-2 mb-2">
      <span class="material-symbols-outlined text-[16px] text-[#0A66C2]" aria-hidden="true">work</span>
      <span class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
        {{ t('linkedinSync.title') }}
      </span>
      <span
        v-if="extensionInstalled"
        class="ml-auto text-[9px] font-semibold uppercase tracking-wide text-emerald-300/90"
      >
        {{ t('linkedinSync.extensionReady') }}
      </span>
    </div>

    <p class="text-[11px] text-slate-400 leading-relaxed mb-2.5 text-left">
      {{ extensionInstalled ? t('linkedinSync.helpWithExtension') : t('linkedinSync.helpWithoutExtension') }}
    </p>

    <div class="flex flex-wrap items-center gap-1.5">
      <template v-if="extensionInstalled">
        <button
          type="button"
          class="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-md bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors disabled:opacity-50 cursor-pointer"
          :disabled="busy"
          @click="onAutoFill"
        >
          <span class="material-symbols-outlined text-[14px]">auto_fix_high</span>
          {{ t('linkedinSync.autoFill') }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-md border border-white/15 text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
          :disabled="busy"
          @click="onCopy"
        >
          <span class="material-symbols-outlined text-[14px]">content_copy</span>
          {{ t('linkedinSync.copyBullets') }}
        </button>
      </template>
      <template v-else>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-md bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors disabled:opacity-50 cursor-pointer"
          :disabled="busy"
          @click="onCopy"
        >
          <span class="material-symbols-outlined text-[14px]">content_copy</span>
          {{ t('linkedinSync.copyBullets') }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-md border border-white/15 text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
          :disabled="busy"
          @click="onDownloadPdf"
        >
          <span class="material-symbols-outlined text-[14px]">picture_as_pdf</span>
          {{ t('linkedinSync.downloadPdf') }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-md border border-white/15 text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
          @click="openLinkedInPositionForm"
        >
          <span class="material-symbols-outlined text-[14px]">open_in_new</span>
          {{ t('linkedinSync.openLinkedIn') }}
        </button>
      </template>

      <button
        type="button"
        class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-md text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        :title="t('linkedinSync.downloadJson')"
        @click="onDownloadJson"
      >
        <span class="material-symbols-outlined text-[14px]">data_object</span>
        <span class="hidden sm:inline">{{ t('linkedinSync.downloadJson') }}</span>
      </button>

      <NuxtLink
        v-if="!extensionInstalled"
        to="/extension/install"
        class="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-blue-300/80 hover:text-blue-200 transition-colors"
      >
        <span class="material-symbols-outlined text-[14px]">extension</span>
        {{ t('linkedinSync.getExtension') }}
      </NuxtLink>
    </div>
  </div>
</template>
