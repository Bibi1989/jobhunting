<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resumeTemplates, getResumeTemplate, resolveResumeTemplateId } from '~/utils/templates'
import type { BuilderResumeData, BuilderCustomSection } from '~/shared/types/builder'
import { downloadServerPdf } from '~/utils/downloadServerPdf'
import {
  prepareEditorHtml,
} from '~/utils/richText'
import { slugifyFilename } from '~/utils/download'
import {
  DEFAULT_SECTIONS_ORDER,
  normalizeSectionsOrder,
  resolveTemplateSlug,
  withLayoutState,
  type ResumeSectionId,
} from '~/shared/pdf/schema'
import { loadBuilderJobPrefill, parseResumeTextToBuilder } from '~/utils/builderJobPrefill'

const toast = useAppToast()
const { canAccessAI, aiBlockedMessage, refreshCredits } = useSaaS()

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const resumeId = route.params.id as string
const exporting = ref(false)
const importing = ref(false)
const enhancing = ref(false)
const importFileInput = ref<HTMLInputElement | null>(null)
const draftFileInput = ref<HTMLInputElement | null>(null)
const uploadedResumeName = ref('')
const rawResumeText = ref('')

function newId() {
  return crypto.randomUUID()
}

const resolvedFormatId = computed(() =>
  resolveResumeTemplateId(resolveTemplateSlug(resumeData.value)),
)

const sectionsOrderModel = computed({
  get: (): ResumeSectionId[] =>
    normalizeSectionsOrder(resumeData.value.sectionsOrder, resumeData.value.customSections || []),
  set: (next: ResumeSectionId[]) => {
    resumeData.value.sectionsOrder = next
  },
})

function selectTemplate(templateId: string) {
  const id = resolveResumeTemplateId(templateId)
  resumeData.value.templateId = id
  resumeData.value.templateSlug = id
}

const activeTab = ref('targetRole')
const activePopoverId = ref<string | null>(null)
const mobileNavOpen = ref(false)
const mobilePane = ref<'edit' | 'preview'>('edit')

const builderTabs = [
  { id: 'targetRole', label: 'Target Role', icon: 'business_center' },
  { id: 'template', label: 'Template', icon: 'view_quilt' },
  { id: 'layout', label: 'Section Order', icon: 'reorder' },
  { id: 'personalInfo', label: 'Personal Info', icon: 'person' },
  { id: 'experience', label: 'Experience', icon: 'work' },
  { id: 'projects', label: 'Projects', icon: 'integration_instructions' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'skills', label: 'Skills', icon: 'psychology' },
  { id: 'achievements', label: 'Achievements', icon: 'emoji_events' },
  { id: 'custom', label: 'Custom Sections', icon: 'dashboard_customize' },
  { id: 'atsCheck', label: 'ATS Check', icon: 'fact_check' },
] as const

function selectBuilderTab(id: string) {
  activeTab.value = id
  mobileNavOpen.value = false
  mobilePane.value = 'edit'
}

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }
  void router.push('/builder')
}

const resumeData = ref<BuilderResumeData>({
  name: 'My New Resume',
  templateId: 'the-distinguished',
  templateSlug: 'the-distinguished',
  sectionsOrder: [...DEFAULT_SECTIONS_ORDER],
  themeColor: '#3b82f6',
  personalInfo: {
    fullName: 'Jonathan R. Sterling',
    jobTitle: 'Product Designer',
    location: 'San Francisco, CA',
    email: 'jonathan.sterling@email.com',
    phone: '415.555.0198',
    linkedin: 'linkedin.com/in/jonathansterling',
    portfolio: 'jonathansterling.design',
    github: '',
    summary: '<p>Strategic and visionary Product Designer with over 8 years of experience building scalable digital ecosystems.</p>'
  },
  experience: [
    {
      id: crypto.randomUUID(),
      title: 'Senior Fullstack Engineer',
      company: 'Innovate Tech Solutions',
      location: 'San Francisco, CA',
      startDate: '2026-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>Led end-to-end delivery of customer-facing web platforms using React, Node.js, and cloud infrastructure.</li><li>Improved release reliability with automated tests and CI/CD, cutting production incidents over successive quarters.</li><li>Mentored engineers and partnered with product to ship scoped features on a predictable cadence.</li></ul>',
    },
  ],
  education: [
    {
      id: crypto.randomUUID(),
      degree: 'B.S. Computer Science',
      school: 'State University',
      location: 'California, USA',
      graduationDate: '2019-06',
      description: '',
    },
  ],
  skills: [
    { id: crypto.randomUUID(), name: 'TypeScript' },
    { id: crypto.randomUUID(), name: 'React' },
    { id: crypto.randomUUID(), name: 'Node.js' },
    { id: crypto.randomUUID(), name: 'System Design' },
  ],
  projects: [],
  achievements: [],
  customSections: [],
  targetJobDescription: '',
  additionalInstructions: '',
})

const loading = ref(false)
const saving = ref(false)
const enhancingIds = ref<Set<string>>(new Set())
const translating = ref(false)

type AtsIssue = {
  severity: 'critical' | 'warning' | 'info'
  category: string
  message: string
  suggestion: string
}
type AtsCheckResult = {
  score: number
  grade: string
  summary: string
  strengths: string[]
  issues: AtsIssue[]
  keywordGaps: string[]
  quickWins: string[]
}

const atsRunning = ref(false)
const atsFixing = ref(false)
const atsResult = ref<AtsCheckResult | null>(null)

function hasResumeSignal() {
  const info = resumeData.value.personalInfo
  if (info?.fullName?.trim()) return true
  if ((info?.summary || '').replace(/<[^>]+>/g, '').trim().length > 20) return true
  if ((resumeData.value.experience || []).length > 0) return true
  if (rawResumeText.value.trim().length > 40) return true
  return false
}

async function draftResumeWithAi() {
  if (!canAccessAI.value) {
    toast.info(aiBlockedMessage() || 'Pro subscription required for AI.')
    return
  }

  const hasJd = Boolean(resumeData.value.targetJobDescription?.trim())
  const hasResume = hasResumeSignal()
  if (!hasJd && !hasResume) {
    toast.info('Upload a resume and/or paste a job description to draft.')
    return
  }

  enhancing.value = true
  try {
    const response = await $fetch<{ resumeData?: BuilderResumeData }>('/api/ai/generate-resume', {
      method: 'POST',
      body: {
        resumeData: resumeData.value,
        jobDescription: resumeData.value.targetJobDescription || '',
        additionalInstructions: resumeData.value.additionalInstructions || '',
        rawResumeText: rawResumeText.value || undefined,
        targetRole: resumeData.value.personalInfo.jobTitle,
      },
    })

    if (response?.resumeData) {
      const next = withLayoutState(response.resumeData)
      next.templateId = resolveResumeTemplateId(next.templateId || resumeData.value.templateId)
      next.templateSlug = next.templateId
      next.sectionsOrder = normalizeSectionsOrder(next.sectionsOrder, next.customSections || [])
      next.targetJobDescription =
        next.targetJobDescription ?? resumeData.value.targetJobDescription
      next.additionalInstructions =
        next.additionalInstructions ?? resumeData.value.additionalInstructions
      resumeData.value = next
      atsResult.value = null
      toast.success(
        hasJd && hasResume ? 'Resume drafted.' : 'Resume drafted from available details.',
      )
      activeTab.value = 'personalInfo'
      mobilePane.value = 'edit'
      await refreshCredits()
      return
    }
    toast.error('AI returned an empty resume. Please try again.')
  } catch (e: unknown) {
    console.error(e)
    const err = e as {
      data?: { statusMessage?: string; message?: string }
      statusMessage?: string
      message?: string
    }
    toast.error(
      err?.data?.statusMessage ||
        err?.data?.message ||
        err?.statusMessage ||
        err?.message ||
        'AI draft failed. Please try again.',
    )
  } finally {
    enhancing.value = false
  }
}

function triggerDraftUpload() {
  if (!canAccessAI.value) {
    toast.info(aiBlockedMessage() || 'Pro subscription required to import a resume.')
    return
  }
  draftFileInput.value?.click()
}

async function handleDraftResumeUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  target.value = ''
  if (importing.value) return

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'resume')

    toast.info('Uploading resume…')
    const docRes = await $fetch<{ document: { contentText: string; originalName?: string } }>(
      '/api/documents',
      { method: 'POST', body: formData },
    )

    if (!docRes.document?.contentText) {
      throw new Error('Could not extract text from document')
    }

    rawResumeText.value = docRes.document.contentText
    uploadedResumeName.value = docRes.document.originalName || file.name

    toast.info('Parsing resume…')
    const parseRes = await $fetch<{ resumeData: BuilderResumeData }>('/api/ai/parse-resume', {
      method: 'POST',
      body: { text: docRes.document.contentText },
    })

    if (parseRes.resumeData) {
      const oldTemplateId = resumeData.value.templateId
      const oldOrder = resumeData.value.sectionsOrder
      const oldLanguage = resumeData.value.language
      const oldJd = resumeData.value.targetJobDescription
      const oldInstructions = resumeData.value.additionalInstructions

      const next = withLayoutState({
        ...parseRes.resumeData,
        templateId: oldTemplateId,
        templateSlug: oldTemplateId,
        sectionsOrder: oldOrder,
        language: oldLanguage,
        targetJobDescription: oldJd,
        additionalInstructions: oldInstructions,
      })
      resumeData.value = next
      atsResult.value = null
      toast.success('Resume loaded — draft with it alone or add a job description.')
      await refreshCredits()
    }
  } catch (err: unknown) {
    console.error(err)
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Failed to import resume.')
  } finally {
    importing.value = false
  }
}

async function runAtsCheck() {
  if (!canAccessAI.value) {
    toast.info(aiBlockedMessage() || 'Pro subscription required for ATS Check.')
    return
  }
  if (atsRunning.value) return
  atsRunning.value = true
  try {
    const result = await $fetch<AtsCheckResult>('/api/ai/ats-check', {
      method: 'POST',
      body: {
        resumeData: resumeData.value,
        targetRole: resumeData.value.personalInfo.jobTitle,
        jobDescription: resumeData.value.targetJobDescription || undefined,
      },
    })
    atsResult.value = result
    await refreshCredits()
    toast.success(`ATS score: ${result.score}/100`)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'ATS check failed.')
  } finally {
    atsRunning.value = false
  }
}

async function fixAtsIssues() {
  if (!canAccessAI.value) {
    toast.info(aiBlockedMessage() || 'Pro subscription required to fix ATS issues.')
    return
  }
  if (!atsResult.value) {
    toast.info('Run ATS Check first.')
    return
  }
  if (atsFixing.value) return
  atsFixing.value = true
  try {
    const response = await $fetch<{ resumeData: BuilderResumeData }>('/api/ai/ats-fix', {
      method: 'POST',
      body: {
        resumeData: resumeData.value,
        atsResult: atsResult.value,
        jobDescription: resumeData.value.targetJobDescription || undefined,
      },
    })
    if (response?.resumeData) {
      const next = withLayoutState(response.resumeData)
      next.templateId = resolveResumeTemplateId(next.templateId || resumeData.value.templateId)
      next.templateSlug = next.templateId
      next.sectionsOrder = normalizeSectionsOrder(next.sectionsOrder, next.customSections || [])
      next.targetJobDescription =
        next.targetJobDescription ?? resumeData.value.targetJobDescription
      next.additionalInstructions =
        next.additionalInstructions ?? resumeData.value.additionalInstructions
      resumeData.value = next
      atsResult.value = null
      await refreshCredits()
      toast.success('ATS fixes applied. Re-run the check to confirm your new score.')
    }
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Failed to apply ATS fixes.')
  } finally {
    atsFixing.value = false
  }
}

function atsSeverityClass(severity: string) {
  if (severity === 'critical') return 'border-red-500/40 bg-red-500/10 text-red-200'
  if (severity === 'warning') return 'border-amber-500/40 bg-amber-500/10 text-amber-100'
  return 'border-sky-500/40 bg-sky-500/10 text-sky-100'
}

function normalizeEnhancedHtml(raw: string) {
  return prepareEditorHtml(raw)
}

async function handleLanguageChange(e: Event) {
  const newLang = (e.target as HTMLSelectElement).value as 'en' | 'de' | 'fr' | 'es'
  await translateResume(newLang)
}

async function translateResume(targetLang: 'en' | 'de' | 'fr' | 'es') {
  if (!canAccessAI.value) {
    toast.info(aiBlockedMessage() || 'Pro subscription required for AI.')
    return
  }
  const previous = resumeData.value.language || 'en'
  translating.value = true
  try {
    const response = await $fetch<{ translatedData: BuilderResumeData }>('/api/ai/translate', {
      method: 'POST',
      body: {
        resumeData: resumeData.value,
        targetLanguage: targetLang,
        mode: 'resume',
      }
    })
    
    if (response && response.translatedData) {
      const oldTemplateId = resumeData.value.templateId
      const oldOrder = resumeData.value.sectionsOrder
      resumeData.value = withLayoutState({
        ...response.translatedData,
        templateId: oldTemplateId,
        templateSlug: oldTemplateId,
        sectionsOrder: oldOrder,
        language: targetLang,
      })
      toast.success(`Translated to ${({ en: 'English', de: 'German', fr: 'French', es: 'Spanish' } as const)[targetLang]}.`)
      await refreshCredits()
    }
  } catch (e) {
    console.error(e)
    toast.error('Failed to translate resume.')
    resumeData.value.language = previous
  } finally {
    translating.value = false
  }
}

function triggerImport() {
  if (!canAccessAI.value) {
    toast.info(aiBlockedMessage() || 'Pro subscription required for AI Resume Import.')
    return
  }
  importFileInput.value?.click()
}

async function handleImportResume(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  target.value = ''

  if (importing.value) return
  importing.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'resume')

    toast.info('Uploading resume...')
    const docRes = await $fetch<{ document: { contentText: string } }>('/api/documents', {
      method: 'POST',
      body: formData,
    })

    if (!docRes.document?.contentText) {
      throw new Error('Could not extract text from document')
    }

    rawResumeText.value = docRes.document.contentText
    uploadedResumeName.value = file.name

    toast.info('Extracting resume data... (this takes ~15 seconds)')
    const parseRes = await $fetch<{ resumeData: BuilderResumeData }>('/api/ai/parse-resume', {
      method: 'POST',
      body: { text: docRes.document.contentText }
    })

    if (parseRes.resumeData) {
      const oldTemplateId = resumeData.value.templateId
      const oldOrder = resumeData.value.sectionsOrder
      const oldLanguage = resumeData.value.language
      const oldJd = resumeData.value.targetJobDescription
      const oldInstructions = resumeData.value.additionalInstructions

      const next = withLayoutState({
        ...parseRes.resumeData,
        templateId: oldTemplateId,
        templateSlug: oldTemplateId,
        sectionsOrder: oldOrder,
        language: oldLanguage,
        targetJobDescription: oldJd,
        additionalInstructions: oldInstructions,
      })
      resumeData.value = next
      atsResult.value = null
      toast.success('Resume imported successfully!')
      await refreshCredits()
    }
  } catch (err: unknown) {
    console.error('Import error:', err)
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Failed to import resume.')
  } finally {
    importing.value = false
  }
}

onMounted(async () => {
  if (resumeId && resumeId !== 'new') {
    loading.value = true
    try {
      const data = await $fetch<BuilderResumeData>(`/api/builder/resume/${resumeId}`)
      const templateId = resolveResumeTemplateId(data.templateId || data.templateSlug || 'the-distinguished')
      resumeData.value = withLayoutState({
        ...data,
        templateId,
        templateSlug: data.templateSlug || templateId,
        projects: data.projects || [],
        achievements: data.achievements || [],
        customSections: data.customSections || [],
        skills: data.skills || [],
      })
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  } else {
    const templateQuery = String(route.query.template || '')
    if (templateQuery) {
      selectTemplate(templateQuery)
      const tpl = getResumeTemplate(resumeData.value.templateId)
      resumeData.value.name = `${tpl.name} Resume`
    }
  }

  await applyJobPrefillFromRoute()
})

async function applyJobPrefillFromRoute() {
  const jobId = route.query.jobId
  if (!jobId) return

  loading.value = true
  try {
    const prefill = await loadBuilderJobPrefill(jobId)
    if (!prefill) return

    if (prefill.description) {
      resumeData.value.targetJobDescription = prefill.description
    }
    if (prefill.title && !resumeData.value.personalInfo.jobTitle?.trim()) {
      resumeData.value.personalInfo.jobTitle = prefill.title
    }
    if (prefill.title || prefill.company) {
      const label = [prefill.title, prefill.company].filter(Boolean).join(' · ')
      if (resumeId === 'new' || resumeData.value.name === 'My New Resume') {
        resumeData.value.name = label ? `${label} Resume` : resumeData.value.name
      }
    }

    if (prefill.resumeText.length > 40) {
      rawResumeText.value = prefill.resumeText
      uploadedResumeName.value = prefill.resumeName
      try {
        const parsed = await parseResumeTextToBuilder(prefill.resumeText)
        if (parsed) {
          const oldTemplateId = resumeData.value.templateId
          const oldOrder = resumeData.value.sectionsOrder
          const oldLanguage = resumeData.value.language
          const oldJd = resumeData.value.targetJobDescription
          const oldInstructions = resumeData.value.additionalInstructions
          const next = withLayoutState({
            ...parsed,
            templateId: oldTemplateId,
            templateSlug: oldTemplateId,
            sectionsOrder: oldOrder,
            language: oldLanguage,
            targetJobDescription: oldJd || prefill.description,
            additionalInstructions: oldInstructions,
            name: resumeData.value.name,
          } as BuilderResumeData)
          if (prefill.title) next.personalInfo.jobTitle = next.personalInfo.jobTitle || prefill.title
          resumeData.value = next
          await refreshCredits()
        }
      } catch (err) {
        console.error(err)
        toast.info('Job description loaded. Upload or paste your CV if parse failed.')
      }
    }

    activeTab.value = 'targetRole'
    toast.success(
      prefill.resumeText
        ? 'Job description and uploaded CV loaded into Target Role.'
        : 'Job description loaded. Upload a CV or draft from the description.',
    )
  } catch (err) {
    console.error(err)
    toast.error('Could not load job details for the builder.')
  } finally {
    loading.value = false
  }
}

async function saveDraft() {
  saving.value = true
  try {
    const payload = withLayoutState(resumeData.value)
    resumeData.value = payload
    if (resumeId === 'new') {
      const { id } = await $fetch<{ id: string }>('/api/builder/resume', {
        method: 'POST',
        body: payload,
      })
      router.replace(`/builder/resume/${id}`)
    } else {
      await $fetch(`/api/builder/resume/${resumeId}`, {
        method: 'PUT',
        body: payload,
      })
    }
    toast.success('Saved successfully.')
  } catch (e) {
    console.error(e)
    toast.error('Failed to save draft.')
  } finally {
    saving.value = false
  }
}

function exportPdf() {
  void downloadPreviewPdf()
}

async function downloadPreviewPdf() {
  if (exporting.value) return
  exporting.value = true
  try {
    const base = slugifyFilename(resumeData.value.personalInfo.fullName || resumeData.value.name || 'resume')
    const layout = withLayoutState(resumeData.value)
    await downloadServerPdf({
      kind: 'resume',
      filename: `${base}-resume`,
      resume: layout,
      templateSlug: resolveTemplateSlug(layout),
      sectionsOrder: normalizeSectionsOrder(layout.sectionsOrder, layout.customSections || []),
    })
    toast.success('PDF downloaded.')
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'PDF export failed. Please try again.'
    toast.error(message)
  } finally {
    exporting.value = false
  }
}

async function enhanceDescription(item: { id: string, title?: string, description?: string }, type: 'experience' | 'project' | 'summary') {
  if (!canAccessAI.value) {
    toast.info(aiBlockedMessage() || 'Pro subscription required for AI.')
    return
  }
  if (type !== 'summary' && !item.title) {
    toast.info('Enter a title before using AI Enhance.')
    return
  }
  
  if (type === 'summary' && !resumeData.value.personalInfo.jobTitle) {
    toast.info('Enter a job title before enhancing the summary.')
    return
  }
  
  const targetTitle = type === 'summary' ? resumeData.value.personalInfo.jobTitle : item.title

  enhancingIds.value = new Set([...enhancingIds.value, item.id])
  try {
    const result = await $fetch<{ enhancedDescription: string }>('/api/ai/enhance-description', {
      method: 'POST',
      body: {
        title: targetTitle,
        currentDescription: type === 'summary' ? resumeData.value.personalInfo.summary : (item.description || ''),
        type,
        experiences: type === 'summary' ? resumeData.value.experience : undefined
      }
    })

    const html = normalizeEnhancedHtml(result.enhancedDescription)
    
    if (type === 'summary') {
      resumeData.value.personalInfo.summary = html
    } else if (type === 'experience') {
      const idx = resumeData.value.experience.findIndex((e) => e.id === item.id)
      if (idx >= 0) {
        // Mutate in place so the same v-for item binding updates.
        resumeData.value.experience[idx]!.description = html
      }
    } else if (type === 'project') {
      const idx = resumeData.value.projects.findIndex((p) => p.id === item.id)
      if (idx >= 0) {
        resumeData.value.projects[idx]!.description = html
      }
    }
    await nextTick()
    toast.success('Description enhanced.')
    await refreshCredits()
  } catch (e) {
    console.error('Enhance failed:', e)
    toast.error('AI enhancement failed. Please try again.')
  } finally {
    const next = new Set(enhancingIds.value)
    next.delete(item.id)
    enhancingIds.value = next
  }
}

function addExperience() {
  resumeData.value.experience.push({
    id: newId(), title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: ''
  })
}
function removeExperience(index: number) { resumeData.value.experience.splice(index, 1) }

function addEducation() {
  resumeData.value.education.push({
    id: newId(), degree: '', school: '', location: '', graduationDate: '', description: ''
  })
}
function removeEducation(index: number) { resumeData.value.education.splice(index, 1) }

function addSkill() {
  resumeData.value.skills.push({ id: newId(), name: '', level: '' })
}
function removeSkill(index: number) { resumeData.value.skills.splice(index, 1) }

function addProject() {
  resumeData.value.projects.push({
    id: newId(), title: '', description: '', isCurrent: false
  })
}
function removeProject(index: number) { resumeData.value.projects.splice(index, 1) }

function addAchievement() {
  resumeData.value.achievements.push({
    id: newId(), title: ''
  })
}
function removeAchievement(index: number) { resumeData.value.achievements.splice(index, 1) }

function addCustomSection() {
  const id = newId()
  resumeData.value.customSections.push({
    id, title: 'New Section', items: []
  })
  resumeData.value.sectionsOrder = normalizeSectionsOrder(
    resumeData.value.sectionsOrder,
    resumeData.value.customSections,
  )
}
function removeCustomSection(index: number) {
  resumeData.value.customSections.splice(index, 1)
  resumeData.value.sectionsOrder = normalizeSectionsOrder(
    resumeData.value.sectionsOrder,
    resumeData.value.customSections,
  )
}

function addCustomItem(section: BuilderCustomSection) {
  section.items.push({ id: newId(), title: '' })
}
function removeCustomItem(section: BuilderCustomSection, itemIndex: number) {
  section.items.splice(itemIndex, 1)
}

</script>

<template>
  <div class="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 h-dvh flex flex-col overflow-hidden">
    <!-- TopNavBar -->
    <header class="flex justify-between items-center px-3 sm:px-6 h-14 sm:h-16 shrink-0 bg-slate-900/40 backdrop-blur-md border-b border-white/10 gap-2">
      <div class="flex items-center gap-2 sm:gap-6 min-w-0">
        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 cursor-pointer"
          aria-label="Go back"
          @click="goBack"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 cursor-pointer"
          aria-label="Open sections"
          @click="mobileNavOpen = !mobileNavOpen"
        >
          <span class="material-symbols-outlined">{{ mobileNavOpen ? 'close' : 'menu' }}</span>
        </button>
        <NuxtLink to="/" class="font-serif text-lg sm:text-2xl text-white font-bold hover:text-blue-300 transition-colors truncate">ScrapeEngine</NuxtLink>
        <nav class="hidden lg:flex gap-6 items-center">
          <NuxtLink to="/builder" class="font-semibold text-slate-300 hover:text-white transition-colors duration-200">My Projects</NuxtLink>
          <NuxtLink to="/builder/templates" class="font-semibold text-slate-300 hover:text-white transition-colors duration-200">Templates</NuxtLink>
        </nav>
      </div>
      <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div class="hidden sm:flex items-center gap-2">
          <select v-model="resumeData.language" @change="handleLanguageChange" class="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all cursor-pointer">
            <option value="en" class="bg-slate-800 text-white">EN</option>
            <option value="de" class="bg-slate-800 text-white">DE</option>
            <option value="fr" class="bg-slate-800 text-white">FR</option>
            <option value="es" class="bg-slate-800 text-white">ES</option>
          </select>
          <span v-if="translating" class="material-symbols-outlined text-blue-400 animate-spin text-sm">refresh</span>
          <input type="text" v-model="resumeData.name" class="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all w-28 lg:w-40" placeholder="Resume Name" />
        </div>
        
        <input type="file" ref="importFileInput" class="hidden" accept=".pdf,.docx,.doc,.txt" @change="handleImportResume" />
        <input type="file" ref="draftFileInput" class="hidden" accept=".pdf,.docx,.doc,.txt,.md" @change="handleDraftResumeUpload" />
        <button @click="triggerImport" :disabled="importing || saving || exporting" class="px-2.5 sm:px-4 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 rounded hover:bg-indigo-500 hover:text-white transition-colors font-semibold text-sm disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <span class="material-symbols-outlined text-[16px]" :class="{'animate-spin': importing}">
            {{ importing ? 'refresh' : 'upload_file' }}
          </span>
          <span class="hidden md:inline">{{ importing ? 'Importing...' : 'Import Resume' }}</span>
        </button>

        <button @click="saveDraft" :disabled="saving" class="px-2.5 sm:px-4 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded hover:bg-blue-500 hover:text-white transition-colors font-semibold text-sm disabled:opacity-50 cursor-pointer">
          <span class="sm:hidden">{{ saving ? '…' : 'Save' }}</span>
          <span class="hidden sm:inline">{{ saving ? 'Saving...' : 'Save Draft' }}</span>
        </button>
        <button @click="exportPdf" :disabled="exporting" class="px-2.5 sm:px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-semibold text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer disabled:opacity-50">
          <span class="sm:hidden">{{ exporting ? '…' : 'PDF' }}</span>
          <span class="hidden sm:inline">{{ exporting ? 'Exporting...' : 'Export PDF' }}</span>
        </button>
      </div>
    </header>

    <!-- Mobile edit / preview switcher -->
    <div class="lg:hidden flex shrink-0 border-b border-white/10 bg-slate-900/70">
      <button
        type="button"
        class="flex-1 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
        :class="mobilePane === 'edit' ? 'text-blue-300 border-b-2 border-blue-400 bg-blue-500/10' : 'text-slate-400'"
        @click="mobilePane = 'edit'"
      >
        Edit
      </button>
      <button
        type="button"
        class="flex-1 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
        :class="mobilePane === 'preview' ? 'text-blue-300 border-b-2 border-blue-400 bg-blue-500/10' : 'text-slate-400'"
        @click="mobilePane = 'preview'"
      >
        Preview
      </button>
    </div>

    <div class="flex flex-1 overflow-hidden relative">
      <!-- Desktop SideNavBar -->
      <aside class="hidden lg:flex w-64 shrink-0 flex-col py-6 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 overflow-y-auto">
        <nav class="flex-1">
          <ul class="space-y-1">
            <li v-for="tab in builderTabs" :key="tab.id">
              <button @click="selectBuilderTab(tab.id)" :class="['w-full flex items-center gap-4 px-6 py-3 text-sm transition-all cursor-pointer', activeTab === tab.id ? 'text-blue-400 font-bold border-r-2 border-blue-400 bg-blue-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200']">
                <span class="material-symbols-outlined">{{ tab.icon }}</span>
                <span class="flex-1 text-left">{{ tab.label }}</span>
                <span
                  v-if="tab.id === 'atsCheck'"
                  class="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                >Pro</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- Mobile section drawer -->
      <div v-if="mobileNavOpen" class="fixed inset-0 z-40 lg:hidden">
        <button type="button" class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" aria-label="Close sections" @click="mobileNavOpen = false" />
        <aside class="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-slate-900 border-r border-white/10 py-4 overflow-y-auto shadow-2xl">
          <p class="px-5 mb-3 text-xs uppercase tracking-widest text-blue-200/60 font-semibold">Sections</p>
          <nav>
            <ul class="space-y-0.5">
              <li v-for="tab in builderTabs" :key="`m-${tab.id}`">
                <button
                  type="button"
                  class="w-full flex items-center gap-3 px-5 py-3 text-sm cursor-pointer"
                  :class="activeTab === tab.id ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300'"
                  @click="selectBuilderTab(tab.id)"
                >
                  <span class="material-symbols-outlined">{{ tab.icon }}</span>
                  <span class="flex-1 text-left">{{ tab.label }}</span>
                </button>
              </li>
            </ul>
          </nav>
          <div class="px-5 pt-4 mt-2 border-t border-white/10 space-y-2 sm:hidden">
            <label class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Language</label>
            <select v-model="resumeData.language" @change="handleLanguageChange" class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none cursor-pointer">
              <option value="en" class="bg-slate-800">EN</option>
              <option value="de" class="bg-slate-800">DE</option>
              <option value="fr" class="bg-slate-800">FR</option>
              <option value="es" class="bg-slate-800">ES</option>
            </select>
            <label class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold pt-1">Name</label>
            <input type="text" v-model="resumeData.name" class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none" placeholder="Resume Name" />
          </div>
        </aside>
      </div>

      <!-- Main Content Canvas -->
      <main class="flex-1 flex overflow-hidden min-w-0">
        <!-- Left Pane: Editor Form -->
        <section
          class="h-full flex-col bg-slate-900/40 backdrop-blur-md border-r border-white/10 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar relative w-full lg:w-1/2"
          :class="mobilePane === 'edit' ? 'flex' : 'hidden lg:flex'"
          @click="activePopoverId = null"
        >
          
          <div v-if="activeTab === 'template'">
            <div class="mb-8">
              <h1 class="font-bold text-2xl text-white mb-1">Choose Template</h1>
              <p class="text-blue-200/60 text-sm">Select a design for your resume.</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                v-for="tpl in resumeTemplates"
                :key="tpl.id"
                type="button"
                @click="selectTemplate(tpl.id)"
                class="cursor-pointer border-2 rounded-xl overflow-hidden text-left transition-all group"
                :class="resolvedFormatId === tpl.id ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.35)]' : 'border-white/10 hover:border-blue-400/50'"
              >
                <div class="aspect-[3/4] bg-slate-900/40 border-b border-white/5 relative overflow-hidden">
                  <BuilderTemplateThumbnail :template-id="tpl.id" :name="tpl.name" />
                  <div
                    v-if="resolvedFormatId === tpl.id"
                    class="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  >
                    Selected
                  </div>
                </div>
                <div class="p-3 bg-white/5">
                  <h3 class="font-bold text-white text-sm mb-0.5 group-hover:text-blue-300 transition-colors">{{ tpl.name }}</h3>
                  <p class="text-[11px] text-slate-400 leading-snug">{{ tpl.desc }}</p>
                </div>
              </button>
            </div>
          </div>

          <div v-if="activeTab === 'layout'" class="space-y-6">
            <div class="mb-2">
              <h1 class="font-bold text-2xl text-white mb-1">Section Order</h1>
              <p class="text-blue-200/60 text-sm">
                Reorder blocks for both the live PDF canvas and the downloaded file.
              </p>
            </div>
            <BuilderPdfSectionReorderPanel
              v-model="sectionsOrderModel"
              :custom-sections="resumeData.customSections"
            />
          </div>

          <div v-if="activeTab === 'personalInfo'">
            <div class="mb-8">
              <h1 class="font-bold text-2xl text-white mb-1">Personal Info</h1>
              <p class="text-blue-200/60 text-sm">Update your contact details and professional summary.</p>
            </div>
            <div class="space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Full Name</label>
                  <input v-model="resumeData.personalInfo.fullName" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Job Title</label>
                  <input v-model="resumeData.personalInfo.jobTitle" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Email</label>
                  <input v-model="resumeData.personalInfo.email" type="email" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Phone</label>
                  <input v-model="resumeData.personalInfo.phone" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Location</label>
                  <input v-model="resumeData.personalInfo.location" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Portfolio Website</label>
                  <input v-model="resumeData.personalInfo.portfolio" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">LinkedIn</label>
                  <input v-model="resumeData.personalInfo.linkedin" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">GitHub</label>
                  <input v-model="resumeData.personalInfo.github" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
              </div>
              <div class="flex flex-col relative">
                <div class="flex justify-between items-end mb-1">
                  <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Professional Summary <span class="text-blue-400 normal-case ml-2">(Rich Text Supported)</span></label>
                  <button @click="enhanceDescription({ id: 'summary', description: resumeData.personalInfo.summary }, 'summary')" :disabled="enhancingIds.has('summary')" class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 z-10">
                    <span class="material-symbols-outlined text-[12px]" :class="{'animate-spin': enhancingIds.has('summary')}">{{ enhancingIds.has('summary') ? 'refresh' : 'auto_awesome' }}</span>
                    {{ enhancingIds.has('summary') ? 'Enhancing...' : 'AI Enhance' }}
                  </button>
                </div>
                <div class="bg-white/5 rounded border border-white/10">
                  <BuilderRichTextEditor v-model="resumeData.personalInfo.summary" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'targetRole'" class="pb-8">
            <div class="mb-8">
              <h1 class="font-bold text-2xl text-white mb-1">Target Role</h1>
              <p class="text-blue-200/60 text-sm">
                Upload a resume and/or paste a job description — either is enough to draft; both is best.
              </p>
            </div>
            <div class="space-y-5">
              <div class="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div class="flex items-start justify-between gap-3 flex-wrap">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-white">Resume for drafting</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">
                      {{
                        uploadedResumeName ||
                        (hasResumeSignal()
                          ? 'Using contact & experience from this project'
                          : 'Optional — upload PDF, DOCX, or TXT')
                      }}
                    </p>
                  </div>
                  <button
                    type="button"
                    :disabled="importing || enhancing"
                    class="text-[11px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-3 py-1.5 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    @click="triggerDraftUpload"
                  >
                    <span class="material-symbols-outlined text-[14px]" :class="{ 'animate-spin': importing }">
                      {{ importing ? 'refresh' : 'upload_file' }}
                    </span>
                    {{ importing ? 'Importing…' : 'Upload resume' }}
                  </button>
                </div>
              </div>

              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  Job Description
                </label>
                <textarea
                  v-model="resumeData.targetJobDescription"
                  class="w-full h-48 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all resize-none custom-scrollbar"
                  placeholder="Optional if you uploaded a resume. Paste the job requirements for a tighter draft…"
                />
              </div>

              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  Additional AI instructions
                </label>
                <textarea
                  v-model="resumeData.additionalInstructions"
                  class="w-full h-28 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all resize-none custom-scrollbar"
                  placeholder="Optional. Example: Emphasize leadership and TypeScript. Keep bullets concise."
                />
                <p class="mt-1.5 text-[11px] text-slate-500">Passed to AI as extra tasks or constraints.</p>
              </div>

              <button
                type="button"
                :disabled="enhancing || importing"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                @click="draftResumeWithAi"
              >
                <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': enhancing }">
                  {{ enhancing ? 'refresh' : 'auto_awesome' }}
                </span>
                {{ enhancing ? 'Drafting…' : 'Draft resume with AI' }}
              </button>

              <div
                v-if="route.query.jobId"
                class="flex flex-wrap gap-2 pt-1"
              >
                <NuxtLink
                  :to="`/builder/cover-letter/new?jobId=${encodeURIComponent(String(route.query.jobId))}`"
                  class="text-[11px] px-3 py-1.5 rounded-lg border border-white/15 text-slate-300 hover:border-blue-400 hover:text-white transition-colors"
                >
                  Cover letter builder
                </NuxtLink>
                <NuxtLink
                  :to="`/dashboard/portfolio?jobId=${encodeURIComponent(String(route.query.jobId))}`"
                  class="text-[11px] px-3 py-1.5 rounded-lg border border-white/15 text-slate-300 hover:border-blue-400 hover:text-white transition-colors"
                >
                  Portfolio
                </NuxtLink>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'experience'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">Professional Experience</h1>
                <p class="text-blue-200/60 text-sm">Highlight your career progression.</p>
              </div>
              <button @click="addExperience" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> Add
              </button>
            </div>
            <div class="space-y-8 pb-10">
              <div v-for="(exp, index) in resumeData.experience" :key="exp.id" class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors">
                <button @click="removeExperience(index)" class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10">delete</button>
                <div class="space-y-5 mt-2">
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Job Title</label>
                    <input v-model="exp.title" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" />
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Company</label>
                      <div class="flex items-center gap-2 relative">
                        <input v-model="exp.company" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                        <button @click.stop="activePopoverId = activePopoverId === exp.id ? null : exp.id" class="text-slate-400 hover:text-blue-400 material-symbols-outlined text-[16px] transition-colors" :class="{'text-blue-400': exp.companyWebsite || activePopoverId === exp.id}">link</button>
                        
                        <!-- Slack-style Link Popover -->
                        <div v-if="activePopoverId === exp.id" @click.stop class="absolute top-full right-0 mt-2 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 w-72">
                          <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block">Link URL</label>
                          <input v-model="exp.companyWebsite" placeholder="https://" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm mb-3 text-white outline-none focus:border-blue-500 transition-colors" />
                          <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block">Display Text</label>
                          <input v-model="exp.companyWebsiteName" placeholder="Text to display (optional)" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Location</label>
                      <input v-model="exp.location" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Start Date</label>
                      <input v-model="exp.startDate" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">End Date</label>
                      <input v-if="!exp.isCurrent" v-model="exp.endDate" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                      <div v-else class="py-1 text-blue-300 font-semibold text-sm">Present</div>
                      <label class="flex items-center gap-2 mt-2 cursor-pointer w-max">
                        <input type="checkbox" v-model="exp.isCurrent" class="accent-blue-500 w-4 h-4 rounded border-white/20" />
                        <span class="text-xs text-slate-300">I currently work here</span>
                      </label>
                    </div>
                  </div>
                  <div class="flex flex-col relative">
                    <div class="flex justify-between items-end mb-1">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Description <span class="text-blue-400 normal-case ml-2">(Rich Text Supported)</span></label>
                      <button @click="enhanceDescription(exp, 'experience')" :disabled="enhancingIds.has(exp.id)" class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 z-10">
                        <span class="material-symbols-outlined text-[12px]" :class="{'animate-spin': enhancingIds.has(exp.id)}">{{ enhancingIds.has(exp.id) ? 'refresh' : 'auto_awesome' }}</span>
                        {{ enhancingIds.has(exp.id) ? 'Enhancing...' : 'AI Enhance' }}
                      </button>
                    </div>
                    <div class="bg-white/5 rounded border border-white/10">
                      <BuilderRichTextEditor v-model="exp.description" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'projects'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">Projects</h1>
                <p class="text-blue-200/60 text-sm">Key projects and case studies.</p>
              </div>
              <button @click="addProject" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> Add
              </button>
            </div>
            <div class="space-y-8 pb-10">
              <div v-for="(proj, index) in resumeData.projects" :key="proj.id" class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors">
                <button @click="removeProject(index)" class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10">delete</button>
                <div class="space-y-5 mt-2">
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Project Title</label>
                    <div class="flex items-center gap-2 relative">
                      <input v-model="proj.title" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" />
                      <button @click.stop="activePopoverId = activePopoverId === proj.id ? null : proj.id" class="text-slate-400 hover:text-blue-400 material-symbols-outlined text-[16px] transition-colors" :class="{'text-blue-400': proj.linkUrl || activePopoverId === proj.id}">link</button>
                      
                      <!-- Slack-style Link Popover -->
                      <div v-if="activePopoverId === proj.id" @click.stop class="absolute top-full right-0 mt-2 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 w-72">
                        <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block">Link URL</label>
                        <input v-model="proj.linkUrl" placeholder="https://" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm mb-3 text-white outline-none focus:border-blue-500 transition-colors" />
                        <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block">Display Text</label>
                        <input v-model="proj.linkName" placeholder="Text to display (optional)" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Organization / Client</label>
                      <input v-model="proj.organization" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Location</label>
                      <input v-model="proj.location" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Start Date</label>
                      <input v-model="proj.startDate" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">End Date</label>
                      <input v-if="!proj.isCurrent" v-model="proj.endDate" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                      <div v-else class="py-1 text-blue-300 font-semibold text-sm">Present</div>
                      <label class="flex items-center gap-2 mt-2 cursor-pointer w-max">
                        <input type="checkbox" v-model="proj.isCurrent" class="accent-blue-500 w-4 h-4 rounded border-white/20" />
                        <span class="text-xs text-slate-300">I currently work on this</span>
                      </label>
                    </div>
                  </div>
                  <div class="flex flex-col relative">
                    <div class="flex justify-between items-end mb-1">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Description <span class="text-blue-400 normal-case ml-2">(Rich Text Supported)</span></label>
                      <button @click="enhanceDescription(proj, 'project')" :disabled="enhancingIds.has(proj.id)" class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 z-10">
                        <span class="material-symbols-outlined text-[12px]" :class="{'animate-spin': enhancingIds.has(proj.id)}">{{ enhancingIds.has(proj.id) ? 'refresh' : 'auto_awesome' }}</span>
                        {{ enhancingIds.has(proj.id) ? 'Enhancing...' : 'AI Enhance' }}
                      </button>
                    </div>
                    <div class="bg-white/5 rounded border border-white/10">
                      <BuilderRichTextEditor v-model="proj.description" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'education'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">Education</h1>
                <p class="text-blue-200/60 text-sm">Your academic background.</p>
              </div>
              <button @click="addEducation" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> Add
              </button>
            </div>
            <div class="space-y-8 pb-10">
              <div v-for="(edu, index) in resumeData.education" :key="edu.id" class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors">
                <button @click="removeEducation(index)" class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10">delete</button>
                <div class="space-y-5 mt-2">
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Degree / Program</label>
                    <input v-model="edu.degree" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" />
                  </div>
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">School / University</label>
                    <input v-model="edu.school" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Location</label>
                      <input v-model="edu.location" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Graduation Date</label>
                      <input v-model="edu.graduationDate" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                  </div>
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Description / Honors <span class="text-blue-400 normal-case ml-2">(Rich Text Supported)</span></label>
                    <div class="bg-white/5 rounded border border-white/10 mt-1">
                      <ClientOnly>
                      <BuilderRichTextEditor v-model="edu.description" editor-class="min-h-[100px]" />
                      </ClientOnly>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'skills'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">Skills</h1>
                <p class="text-blue-200/60 text-sm">Core competencies and technical skills.</p>
              </div>
              <button @click="addSkill" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> Add
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
              <div v-for="(skill, index) in resumeData.skills" :key="skill.id" class="flex items-center gap-2 bg-white/5 p-2 px-3 rounded-lg border border-white/10 group hover:border-white/20 transition-colors">
                <input v-model="skill.name" type="text" class="flex-1 bg-transparent border-none text-sm outline-none text-white" placeholder="e.g. TypeScript" />
                <button @click="removeSkill(index)" class="text-red-400 material-symbols-outlined text-sm hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">close</button>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'achievements'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">Achievements & Awards</h1>
                <p class="text-blue-200/60 text-sm">Notable honors, certifications, and awards.</p>
              </div>
              <button @click="addAchievement" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> Add
              </button>
            </div>
            <div class="space-y-6 pb-10">
              <div v-for="(ach, index) in resumeData.achievements" :key="ach.id" class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors">
                <button @click="removeAchievement(index)" class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10">delete</button>
                <div class="space-y-5 mt-2">
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Title</label>
                    <input v-model="ach.title" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" />
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Issuer / Organization</label>
                      <input v-model="ach.issuer" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Date</label>
                      <input v-model="ach.date" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                  </div>
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Description (Optional) <span class="text-blue-400 normal-case ml-2">(Rich Text Supported)</span></label>
                    <div class="bg-white/5 rounded border border-white/10 mt-1">
                      <ClientOnly>
                      <BuilderRichTextEditor v-model="ach.description" editor-class="min-h-[100px]" />
                      </ClientOnly>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'custom'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">Custom Sections</h1>
                <p class="text-blue-200/60 text-sm">Add any custom categories like Publications, Volunteering, etc.</p>
              </div>
              <button @click="addCustomSection" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> Section
              </button>
            </div>
            <div class="space-y-10 pb-10">
              <div v-for="(section, sIndex) in resumeData.customSections" :key="section.id" class="bg-white/5 p-6 rounded-xl border border-white/10 relative">
                <button @click="removeCustomSection(sIndex)" class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors z-10">delete</button>
                <div class="flex flex-col mb-6 w-3/4">
                  <label class="text-[10px] uppercase font-semibold text-blue-400 tracking-wider mb-1">Section Title</label>
                  <input v-model="section.title" type="text" class="w-full bg-transparent border-0 border-b-2 border-blue-500/50 py-1 focus:border-blue-400 text-white text-lg font-bold outline-none transition-colors" />
                </div>
                
                <div class="space-y-6">
                  <div v-for="(item, iIndex) in section.items" :key="item.id" class="bg-black/20 p-4 rounded border border-white/5 relative group hover:border-white/20 transition-colors">
                    <button @click="removeCustomItem(section, iIndex)" class="absolute top-2 right-2 text-red-400 hover:text-red-300 material-symbols-outlined text-sm transition-colors opacity-0 group-hover:opacity-100 z-10">close</button>
                    <div class="space-y-4">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="flex flex-col">
                          <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Item Title</label>
                          <input v-model="item.title" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none text-sm transition-colors" />
                        </div>
                        <div class="flex flex-col">
                          <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Date</label>
                          <input v-model="item.date" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none text-sm transition-colors" />
                        </div>
                      </div>
                      <div class="flex flex-col">
                        <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Subtitle</label>
                        <input v-model="item.subtitle" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none text-sm transition-colors" />
                      </div>
                      <div class="flex flex-col">
                        <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Description <span class="text-blue-400 normal-case ml-2">(Rich Text Supported)</span></label>
                        <div class="bg-white/5 rounded border border-white/10 mt-1">
                          <ClientOnly>
                          <BuilderRichTextEditor v-model="item.description" editor-class="min-h-[100px]" />
                          </ClientOnly>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button @click="addCustomItem(section)" class="text-xs flex items-center text-blue-300 hover:text-blue-400 transition-colors mt-4">
                  <span class="material-symbols-outlined text-[14px] mr-1">add</span> Add Item
                </button>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'atsCheck'" class="pb-12">
            <div class="mb-8">
              <div class="flex items-center gap-2 mb-1">
                <h1 class="font-bold text-2xl text-white">ATS Check</h1>
                <span class="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Pro</span>
              </div>
              <p class="text-blue-200/60 text-sm">
                Score your resume for applicant tracking systems and get concrete fixes. Uses 2 credits per run.
              </p>
            </div>

            <div v-if="!canAccessAI" class="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100 text-sm">
              {{ aiBlockedMessage() || 'Upgrade to Pro and keep credits available to run ATS Check.' }}
              <NuxtLink to="/pricing" class="ml-2 underline text-amber-200 hover:text-white">View pricing</NuxtLink>
            </div>

            <div class="space-y-4 mb-6">
              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  Target job description <span class="normal-case text-slate-500">(optional)</span>
                </label>
                <textarea
                  v-model="resumeData.targetJobDescription"
                  rows="5"
                  class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-400 resize-y"
                  placeholder="Paste a job description to check keyword alignment (same field as Target Role)…"
                />
              </div>
              <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-[0_0_18px_rgba(99,102,241,0.35)]"
                :disabled="atsRunning || atsFixing || !canAccessAI"
                @click="runAtsCheck"
              >
                <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': atsRunning }">
                  {{ atsRunning ? 'refresh' : 'fact_check' }}
                </span>
                {{ atsRunning ? 'Analyzing…' : 'Run ATS Check' }}
              </button>
              <button
                v-if="atsResult"
                type="button"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors disabled:opacity-50 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                :disabled="atsFixing || atsRunning || !canAccessAI"
                @click="fixAtsIssues"
              >
                <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': atsFixing }">
                  {{ atsFixing ? 'refresh' : 'auto_fix_high' }}
                </span>
                {{ atsFixing ? 'Applying fixes…' : 'Fix ATS Issues' }}
              </button>
              </div>
              <p v-if="atsResult" class="text-[11px] text-slate-400 w-full">
                Fix uses 3 credits and rewrites summary, bullets, and skills from the audit findings.
              </p>
            </div>

            <div v-if="atsResult" class="space-y-6">
              <div class="rounded-xl border border-white/10 bg-white/5 p-6 flex flex-wrap items-center gap-6">
                <div class="flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 border-indigo-400/60 bg-indigo-500/10">
                  <span class="text-3xl font-black text-white">{{ atsResult.score }}</span>
                  <span class="text-[10px] uppercase tracking-widest text-indigo-200">/ 100</span>
                </div>
                <div class="flex-1 min-w-[200px]">
                  <p class="text-xs uppercase tracking-widest text-slate-400 mb-1">Grade {{ atsResult.grade }}</p>
                  <p class="text-slate-200 text-sm leading-relaxed">{{ atsResult.summary }}</p>
                </div>
              </div>

              <div v-if="atsResult.strengths.length">
                <h3 class="text-xs uppercase tracking-widest text-emerald-300/80 font-semibold mb-2">Strengths</h3>
                <ul class="space-y-1.5">
                  <li
                    v-for="(s, i) in atsResult.strengths"
                    :key="`str-${i}`"
                    class="text-sm text-slate-300 flex gap-2"
                  >
                    <span class="material-symbols-outlined text-emerald-400 text-[16px] mt-0.5">check_circle</span>
                    <span>{{ s }}</span>
                  </li>
                </ul>
              </div>

              <div v-if="atsResult.issues.length">
                <h3 class="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Issues</h3>
                <div class="space-y-3">
                  <div
                    v-for="(issue, i) in atsResult.issues"
                    :key="`iss-${i}`"
                    class="rounded-lg border p-3 text-sm"
                    :class="atsSeverityClass(issue.severity)"
                  >
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[10px] uppercase font-bold tracking-wider opacity-80">{{ issue.severity }}</span>
                      <span class="text-[10px] uppercase tracking-wider opacity-60">{{ issue.category }}</span>
                    </div>
                    <p class="font-medium mb-1">{{ issue.message }}</p>
                    <p class="opacity-80 text-xs leading-relaxed">{{ issue.suggestion }}</p>
                  </div>
                </div>
              </div>

              <div v-if="atsResult.keywordGaps.length" class="flex flex-wrap gap-2">
                <h3 class="w-full text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Keyword gaps</h3>
                <span
                  v-for="(kw, i) in atsResult.keywordGaps"
                  :key="`kw-${i}`"
                  class="text-[11px] px-2 py-1 rounded-full bg-white/10 text-slate-200 border border-white/10"
                >{{ kw }}</span>
              </div>

              <div v-if="atsResult.quickWins.length">
                <h3 class="text-xs uppercase tracking-widest text-blue-300/80 font-semibold mb-2">Quick wins</h3>
                <ol class="list-decimal list-inside space-y-1.5 text-sm text-slate-300">
                  <li v-for="(w, i) in atsResult.quickWins" :key="`qw-${i}`">{{ w }}</li>
                </ol>
              </div>
            </div>
          </div>

        </section>

        <!-- Right Pane: Live PDF preview (matches selected gallery template) -->
        <section
          class="h-full bg-slate-800/80 overflow-auto p-4 sm:p-8 lg:p-12 justify-start lg:justify-center items-start shadow-inner w-full lg:w-1/2"
          :class="mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'"
        >
          <div class="shrink-0 mx-auto">
            <BuilderPdfResumePdfPreview :resume="resumeData" />
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Quill Editor Overrides */
:deep(.ql-editor-custom) {
  /* Quill adds lots of margins/paddings, we want to normalize it */
}
:deep(.ql-toolbar.ql-snow) {
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.2);
}
:deep(.ql-container.ql-snow) {
  border: none;
  font-family: inherit;
  font-size: 0.875rem;
}
:deep(.ql-snow .ql-stroke) {
  stroke: #94a3b8;
}
:deep(.ql-snow .ql-fill) {
  fill: #94a3b8;
}
:deep(.ql-snow .ql-picker) {
  color: #94a3b8;
}
:deep(.ql-snow .ql-picker-options) {
  background-color: #1e293b;
  border-color: rgba(255,255,255,0.1);
}
:deep(.ql-editor.ql-blank::before) {
  color: #64748b;
  font-style: italic;
}

/* Bullet list and ordered list fixes for the editor — Quill draws markers via .ql-ui */
:deep(.ql-editor ul), :deep(.ql-editor ol) {
  list-style: none !important;
  padding-left: 0.25rem;
}
:deep(.ql-editor li) {
  list-style: none !important;
}
:deep(.ql-editor *) {
  background-color: transparent !important;
}

/* Quill Tooltip Fixes */
:deep(.ql-snow .ql-tooltip) {
  background-color: #1e293b;
  border: 1px solid rgba(255,255,255,0.1);
  color: #f8fafc;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  white-space: nowrap;
}
:deep(.ql-snow .ql-tooltip input[type=text]) {
  background-color: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}
:deep(.ql-snow .ql-tooltip input[type=text]::placeholder) {
  color: #64748b;
}
:deep(.ql-snow .ql-tooltip a.ql-action::after) {
  color: #3b82f6;
}
:deep(.ql-snow .ql-tooltip::before) {
  content: "URL:";
  line-height: 26px;
  margin-right: 8px;
}

/* Date Picker styling for dark theme */
input[type="month"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
  opacity: 0.6;
}
input[type="month"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* Base styling for rich text content to match the resume aesthetic */
:deep(.rich-text-content p) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
:deep(.rich-text-content ul),
:deep(.rich-text-content ol) {
  width: 100%;
  max-width: 100%;
  padding-left: 1.35rem;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
:deep(.rich-text-content ul) {
  list-style-type: disc;
}
:deep(.rich-text-content ol) {
  list-style-type: decimal;
}
:deep(.rich-text-content li[data-list='bullet']) {
  list-style-type: disc;
}
:deep(.rich-text-content li[data-list='ordered']) {
  list-style-type: decimal;
}
:deep(.rich-text-content li) {
  display: list-item;
  width: 100%;
  max-width: 100%;
  margin-bottom: 0.25rem;
  white-space: normal;
}
:deep(.rich-text-content .ql-ui) {
  display: none !important;
}
:deep(.rich-text-content strong) {
  font-weight: 600;
  color: #0f172a;
}
:deep(.rich-text-content em) {
  font-style: italic;
}
:deep(.rich-text-content h1),
:deep(.rich-text-content h2),
:deep(.rich-text-content h3) {
  font-weight: bold;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  color: #0f172a;
}
</style>
