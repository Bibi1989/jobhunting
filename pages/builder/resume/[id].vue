<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resumeTemplates, getResumeTemplate, resolveResumeTemplateId } from '~/utils/templates'
import type { BuilderResumeData, BuilderCustomSection } from '~/shared/types/builder'
import { DEFAULT_DESIGN_SETTINGS } from '~/shared/types/builder'
import { downloadServerPdf } from '~/utils/downloadServerPdf'
import {
  normalizeBulletListHtml,
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
import { loadBuilderJobPrefill, parseResumeTextToBuilder, consumeApplyPrefill } from '~/utils/builderJobPrefill'
import { extractKeywordsFromText } from '~/utils/keywordExtractor'
import { cloneJson, useAiUndo } from '~/composables/useAiUndo'

const toast = useAppToast()
const confirmDialog = useAppConfirm()
const { t } = useI18n()
const { resumeDesc } = useTemplateLabels()
const { canAccessAI, aiBlockedMessage, refreshCredits } = useSaaS()
const showApplyModal = ref(false)
const {
  canUndo: canUndoAi,
  lastLabel: lastAiUndoLabel,
  push: pushAiUndo,
  undo: undoAi,
  undoScope: undoAiScope,
  canUndoScope: canUndoAiScope,
} = useAiUndo()

function notifyAiSuccess(message: string) {
  toast.success(message, {
    action: canUndoAi.value
      ? {
          label: 'Undo',
          onClick: () => {
            const entry = undoAi()
            if (entry) toast.info(`Reverted: ${entry.label}`)
          },
        }
      : undefined,
  })
}

function pushDocumentUndo(label: string) {
  const snapshot = cloneJson(resumeData.value)
  pushAiUndo('document', label, () => {
    resumeData.value = withLayoutState(cloneJson(snapshot))
  })
}

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
const alsoGenerateCoverLetter = ref(false)
const tailoringPreset = ref<'ats-first' | 'impact-first' | 'leadership' | 'tech-expert'>('ats-first')

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

const SPACING_PRESET_VALUES = {
  'ats-stable': { fontSize: 10, lineHeight: 1.4, marginHorizontal: 36, marginVertical: 36 },
  balanced: { fontSize: 9.5, lineHeight: 1.35, marginHorizontal: 32, marginVertical: 32 },
  compact: { fontSize: 8.5, lineHeight: 1.25, marginHorizontal: 24, marginVertical: 24 },
} as const

function applySpacingPreset(preset: 'ats-stable' | 'balanced' | 'compact') {
  const values = SPACING_PRESET_VALUES[preset]
  resumeData.value.spacingPreset = preset
  resumeData.value.fontSize = values.fontSize
  resumeData.value.lineHeight = values.lineHeight
  resumeData.value.marginHorizontal = values.marginHorizontal
  resumeData.value.marginVertical = values.marginVertical
}

function layoutSliderValue(
  key: 'fontSize' | 'lineHeight' | 'marginHorizontal' | 'marginVertical',
  fallback: number,
) {
  const n = Number(resumeData.value[key])
  return Number.isFinite(n) ? n : fallback
}

const activeTab = ref<string>('targetRole')
const expandedHeatmap = ref(false)
const selectedHeatmapKeyword = ref<string | null>(null)

const activeKeywords = computed(() => {
  if (atsResult.value?.keywordsAnalysis?.length) {
    return atsResult.value.keywordsAnalysis.map(k => k.keyword)
  }
  const jd = resumeData.value.targetJobDescription || ''
  return extractKeywordsFromText(jd)
})

function stripHtmlToPlain(html?: string | null): string {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()
}

function htmlToBulletsList(html?: string | null): string[] {
  if (!html) return []
  const match = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi)
  if (!match) return [stripHtmlToPlain(html)]
  return match.map(li => stripHtmlToPlain(li))
}

type LiveKeywordMatch = {
  keyword: string
  isCovered: boolean
  locations: {
    section: string
    title: string
    bulletIndex?: number
    text?: string
  }[]
}

const liveKeywordMatches = computed<LiveKeywordMatch[]>(() => {
  const keywords = activeKeywords.value
  const data = resumeData.value
  if (!keywords.length) return []

  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return keywords.map(kw => {
    const escaped = escapeRegExp(kw)
    let regex: RegExp
    if (/[+#.a-zA-Z0-9]+/.test(kw)) {
      regex = new RegExp(`(?:\\b|\\s|^)${escaped}(?:\\b|\\s|$|\\.)`, 'i')
    } else {
      regex = new RegExp(escaped, 'i')
    }

    const locations: LiveKeywordMatch['locations'] = []

    // 1. Check Summary
    const summaryText = stripHtmlToPlain(data.personalInfo?.summary || '')
    if (regex.test(summaryText)) {
      locations.push({
        section: 'Summary',
        title: 'Professional Summary',
        text: summaryText
      })
    }

    // 2. Check Skills
    const skillsList = data.skills || []
    skillsList.forEach(s => {
      if (regex.test(s.name || '')) {
        locations.push({
          section: 'Skills',
          title: `Skill: ${s.name}`
        })
      }
    })

    // 3. Check Experience
    const experienceList = data.experience || []
    experienceList.forEach((job) => {
      const jobTitle = job.title || 'Role'
      const jobCompany = job.company || 'Company'
      if (regex.test(jobTitle)) {
        locations.push({
          section: 'Experience',
          title: `${jobTitle} at ${jobCompany}`
        })
      }
      
      const bullets = htmlToBulletsList(job.description)
      bullets.forEach((bText, bIdx) => {
        if (regex.test(bText)) {
          locations.push({
            section: 'Experience',
            title: `${jobTitle} at ${jobCompany}`,
            bulletIndex: bIdx + 1,
            text: bText
          })
        }
      })
    })

    // 4. Check Projects
    const projectsList = data.projects || []
    projectsList.forEach((proj) => {
      const projTitle = proj.title || 'Project'
      if (regex.test(projTitle)) {
        locations.push({
          section: 'Projects',
          title: projTitle
        })
      }
      if (proj.projectDescription && regex.test(proj.projectDescription)) {
        locations.push({
          section: 'Projects',
          title: projTitle,
          text: proj.projectDescription
        })
      }
      
      const bullets = htmlToBulletsList(proj.description)
      bullets.forEach((bText, bIdx) => {
        if (regex.test(bText)) {
          locations.push({
            section: 'Projects',
            title: projTitle,
            bulletIndex: bIdx + 1,
            text: bText
          })
        }
      })
    })

    return {
      keyword: kw,
      isCovered: locations.length > 0,
      locations
    }
  })
})

const liveCoverageCount = computed(() => {
  return liveKeywordMatches.value.filter(k => k.isCovered).length
})

const liveCoverageTotal = computed(() => {
  return liveKeywordMatches.value.length
})

const activePopoverId = ref<string | null>(null)
const mobileNavOpen = ref(false)
const mobilePane = ref<'edit' | 'preview'>('edit')

const builderTabs = computed(() => [
  { id: 'targetRole', label: t('builderUi.tabTargetRole'), icon: 'business_center' },
  { id: 'template', label: t('builderUi.tabTemplate'), icon: 'view_quilt' },
  { id: 'layout', label: t('builderUi.tabSectionOrder'), icon: 'reorder' },
  { id: 'personalInfo', label: t('builderUi.tabPersonalInfo'), icon: 'person' },
  { id: 'experience', label: t('builderUi.tabExperience'), icon: 'work' },
  { id: 'projects', label: t('builderUi.tabProjects'), icon: 'integration_instructions' },
  { id: 'education', label: t('builderUi.tabEducation'), icon: 'school' },
  { id: 'skills', label: t('builderUi.tabSkills'), icon: 'psychology' },
  { id: 'achievements', label: t('builderUi.tabAchievements'), icon: 'emoji_events' },
  { id: 'custom', label: t('builderUi.tabCustomSections'), icon: 'dashboard_customize' },
  { id: 'atsCheck', label: t('builderUi.tabAtsCheck'), icon: 'fact_check' },
  { id: 'history', label: t('builderUi.tabHistory'), icon: 'history' },
])

function selectBuilderTab(id: string) {
  activeTab.value = id
  mobileNavOpen.value = false
  mobilePane.value = 'edit'
}

function goToApplyEmailPage() {
  mobileNavOpen.value = false
  if (resumeId && resumeId !== 'new') {
    void navigateTo(`/builder/apply-email?resume=${resumeId}`)
    return
  }
  void navigateTo('/builder/apply-email')
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
  templateId: 'the-corporate',
  templateSlug: 'the-corporate',
  sectionsOrder: [...DEFAULT_SECTIONS_ORDER],
  themeColor: '#3b82f6',
  spacingPreset: 'balanced',
  fontSize: 9.5,
  lineHeight: 1.35,
  marginHorizontal: 32,
  marginVertical: 32,
  design: { ...DEFAULT_DESIGN_SETTINGS },
  useMetrics: false,
  personalInfo: {
    fullName: 'Jonathan R. Sterling',
    jobTitle: 'Product Designer',
    location: 'San Francisco, CA',
    email: 'jonathan.sterling@email.com',
    phone: '415.555.0198',
    linkedin: 'linkedin.com/in/jonathansterling',
    portfolio: 'jonathansterling.design',
    github: '',
    summary: '<p>Strategic and visionary Product Designer with over 8 years of experience building scalable digital ecosystems.</p>',
    targetRole: '',
    commandPrompt: ''
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
      targetRole: '',
      commandPrompt: ''
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
type AtsKeywordAnalysis = {
  keyword: string
  status: 'missing' | 'found'
  count: number
  foundInSection: 'experience' | 'projects' | 'skills' | 'summary' | 'none'
}
type AtsSuggestedRewrite = {
  original: string
  suggested: string
  explanation: string
}
type AtsSectionChangeProposal = {
  section: 'experience' | 'projects' | 'skills' | 'summary'
  relevanceReason: string
  suggestedRewrites: AtsSuggestedRewrite[]
}
type AtsCheckResult = {
  score: number
  grade: string
  summary: string
  strengths: string[]
  issues: AtsIssue[]
  keywordGaps: string[]
  quickWins: string[]
  keywordsAnalysis?: AtsKeywordAnalysis[]
  sectionChanges?: AtsSectionChangeProposal[]
}

const atsRunning = ref(false)
const atsFixing = ref(false)
const atsResult = ref<AtsCheckResult | null>(null)
const atsFixInstructions = ref('')

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
        tailoringPreset: tailoringPreset.value,
        useMetrics: resumeData.value.useMetrics === true,
      },
    })

    if (response?.resumeData) {
      pushDocumentUndo('Undo AI resume draft')
      const next = withLayoutState(response.resumeData)
      next.templateId = resolveResumeTemplateId(next.templateId || resumeData.value.templateId)
      next.templateSlug = next.templateId
      next.sectionsOrder = normalizeSectionsOrder(next.sectionsOrder, next.customSections || [])
      next.targetJobDescription =
        next.targetJobDescription || resumeData.value.targetJobDescription || ''
      next.additionalInstructions =
        next.additionalInstructions || resumeData.value.additionalInstructions || ''
      next.useMetrics = resumeData.value.useMetrics === true
      if (alsoGenerateCoverLetter.value) {
        toast.info('Drafting cover letter…')
        try {
          const clResponse = await $fetch<{ content?: string }>('/api/ai/generate-cover-letter', {
            method: 'POST',
            body: {
              resumeData: response.resumeData,
              jobDescription: resumeData.value.targetJobDescription || '',
              companyName: '',
              hiringManager: 'Hiring Team',
              tone: 'professional',
              currentContent: '',
              additionalInstructions: resumeData.value.additionalInstructions || '',
              rawResumeText: rawResumeText.value || undefined,
              tailoringPreset: tailoringPreset.value,
              useMetrics: resumeData.value.useMetrics === true,
            },
          })
          if (clResponse?.content) {
            next.coverLetter = {
              jobDescription: resumeData.value.targetJobDescription || '',
              companyName: '',
              hiringManager: 'Hiring Team',
              tone: 'professional',
              content: clResponse.content,
              additionalInstructions: resumeData.value.additionalInstructions || '',
            }
          }
        } catch (err) {
          console.error('Failed to generate cover letter', err)
          toast.error('Resume drafted, but cover letter generation failed.')
        }
      }

      resumeData.value = next
      atsResult.value = null

      let savedId = resumeId
      try {
        const payload = withLayoutState(resumeData.value)
        if (resumeId === 'new') {
          const { id } = await $fetch<{ id: string }>('/api/builder/resume', {
            method: 'POST',
            body: payload,
          })
          savedId = id
          router.replace(`/builder/resume/${id}`)
        } else {
          await $fetch(`/api/builder/resume/${resumeId}`, {
            method: 'PUT',
            body: payload,
          })
        }
      } catch (saveErr) {
        console.error('Auto-save failed', saveErr)
      }

      toast.success(
        alsoGenerateCoverLetter.value && next.coverLetter?.content
          ? 'Resume and cover letter drafted.'
          : hasJd && hasResume ? 'Resume drafted.' : 'Resume drafted from available details.',
        {
          action: {
            label: 'Undo',
            onClick: () => {
              const entry = undoAi()
              if (entry) toast.info(`Reverted: ${entry.label}`)
            },
          },
        },
      )
      activeTab.value = 'personalInfo'
      mobilePane.value = 'edit'
      await refreshCredits()

      if (alsoGenerateCoverLetter.value && next.coverLetter?.content && savedId && savedId !== 'new') {
        const confirmDialog = useAppConfirm()
        const wantToView = await confirmDialog.confirm({
          title: 'Cover Letter Ready',
          message: 'Your cover letter has been successfully drafted. Would you like to view it in the cover letter builder?',
          confirmLabel: 'View Cover Letter',
          cancelLabel: 'Keep Editing Resume',
        })
        if (wantToView) {
          void router.push(`/builder/cover-letter/${savedId}`)
        }
      }
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

async function importResumeFile(file: File) {
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
    pushDocumentUndo('Undo resume import')
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
      name: resumeData.value.name,
    })
    resumeData.value = next
    atsResult.value = null
    await refreshCredits()
  }
}

async function handleDraftResumeUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  target.value = ''
  if (importing.value) return

  importing.value = true
  try {
    await importResumeFile(file)
    toast.success('Resume loaded — draft with it alone or add a job description.')
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
    toast.success(`ATS score: ${result.score}/100. 2 credits used.`)
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
        fixInstructions: atsFixInstructions.value.trim() || undefined,
        useMetrics: resumeData.value.useMetrics === true,
      },
    })
    if (response?.resumeData) {
      pushDocumentUndo('Undo ATS fixes')
      const next = withLayoutState(response.resumeData)
      next.templateId = resolveResumeTemplateId(next.templateId || resumeData.value.templateId)
      next.templateSlug = next.templateId
      next.sectionsOrder = normalizeSectionsOrder(next.sectionsOrder, next.customSections || [])
      next.useMetrics = resumeData.value.useMetrics === true
      resumeData.value = next
      atsResult.value = null
      await refreshCredits()
      await saveDraftWithLabel('ATS Fix')
      notifyAiSuccess('ATS fixes applied and saved. 3 credits used. Re-run the check to confirm your new score.')
    }
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || 'Failed to apply ATS fixes.')
  } finally {
    atsFixing.value = false
  }
}

function atsSeverityClass(severity: string) {
  if (severity === 'critical') return 'border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-200'
  if (severity === 'warning') return 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100'
  return 'border-sky-500/40 bg-sky-500/10 text-sky-950 dark:text-sky-100'
}

function normalizeEnhancedHtml(raw: string, asBullets = false) {
  const cleaned = prepareEditorHtml(raw)
  if (!asBullets) return cleaned
  return normalizeBulletListHtml(cleaned)
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
      pushDocumentUndo('Undo translation')
      const oldTemplateId = resumeData.value.templateId
      const oldOrder = resumeData.value.sectionsOrder
      resumeData.value = withLayoutState({
        ...response.translatedData,
        templateId: oldTemplateId,
        templateSlug: oldTemplateId,
        sectionsOrder: oldOrder,
        language: targetLang,
      })
      notifyAiSuccess(`Translated to ${({ en: 'English', de: 'German', fr: 'French', es: 'Spanish' } as const)[targetLang]}.`)
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
      toast.success('Resume imported successfully. 2 credits used.')
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
        targetJobDescription: data.targetJobDescription || '',
        additionalInstructions: data.additionalInstructions || '',
      })
      await fetchVersions()
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
  const from = String(route.query.from || '')
  const fromApply = from === 'apply' || from === 'chrome-extension'
  const jobId = route.query.jobId

  if (!fromApply && !jobId) return

  loading.value = true
  try {
    if (fromApply) {
      const prefill = consumeApplyPrefill()
      if (!prefill?.description && !prefill?.resumeFile) {
        // Fallback: latest uploaded resume + empty JD still opens Target Role
        const docs = await $fetch<{
          resume: { contentText?: string; originalName?: string } | null
        }>('/api/documents').catch(() => ({ resume: null }))
        if (docs.resume?.contentText && docs.resume.contentText.trim().length > 40) {
          rawResumeText.value = docs.resume.contentText.trim()
          uploadedResumeName.value = docs.resume.originalName || 'Uploaded resume'
        }
        activeTab.value = 'targetRole'
        toast.info(
          from === 'chrome-extension'
            ? 'Extension handoff had no job text. Paste a job description to continue.'
            : 'Add a job description to tailor your resume.',
        )
        return
      }

      if (prefill.description) {
        resumeData.value.targetJobDescription = prefill.description
      }
      if (prefill.title && !resumeData.value.personalInfo.jobTitle?.trim()) {
        resumeData.value.personalInfo.jobTitle = prefill.title
      }
      if (prefill.title) {
        if (resumeId === 'new' || resumeData.value.name === 'My New Resume') {
          resumeData.value.name = `${prefill.title} Resume`
        }
      }

      if (prefill.resumeFile) {
        importing.value = true
        try {
          await importResumeFile(prefill.resumeFile)
        } catch (err) {
          console.error(err)
          toast.info('Job description loaded. Upload your CV again if import failed.')
        } finally {
          importing.value = false
        }
      } else if (prefill.resumeName) {
        // File lost after refresh — try latest uploaded document
        const docs = await $fetch<{
          resume: { contentText?: string; originalName?: string } | null
        }>('/api/documents').catch(() => ({ resume: null }))
        if (docs.resume?.contentText && docs.resume.contentText.trim().length > 40) {
          rawResumeText.value = docs.resume.contentText.trim()
          uploadedResumeName.value = docs.resume.originalName || prefill.resumeName
          try {
            const parsed = await parseResumeTextToBuilder(rawResumeText.value)
            if (parsed) {
              const oldTemplateId = resumeData.value.templateId
              const oldOrder = resumeData.value.sectionsOrder
              const oldLanguage = resumeData.value.language
              const oldJd = resumeData.value.targetJobDescription
              const oldInstructions = resumeData.value.additionalInstructions
              resumeData.value = withLayoutState({
                ...parsed,
                templateId: oldTemplateId,
                templateSlug: oldTemplateId,
                sectionsOrder: oldOrder,
                language: oldLanguage,
                targetJobDescription: oldJd || prefill.description,
                additionalInstructions: oldInstructions,
                name: resumeData.value.name,
              } as BuilderResumeData)
              if (prefill.title) {
                resumeData.value.personalInfo.jobTitle =
                  resumeData.value.personalInfo.jobTitle || prefill.title
              }
              await refreshCredits()
            }
          } catch (err) {
            console.error(err)
          }
        }
      }

      activeTab.value = 'targetRole'
      toast.success(
        prefill.resumeFile || uploadedResumeName.value
          ? 'Job description and resume loaded into Target Role.'
          : from === 'chrome-extension'
            ? 'Job description imported from Chrome. Upload a CV or run AI draft.'
            : 'Job description loaded. Upload a CV or draft from the description.',
      )
      return
    }

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

const versions = ref<Array<{ id: string; label: string; createdAt: string; content: any }>>([])
const loadingVersions = ref(false)
const reverting = ref(false)
const selectedVersionId = ref<string | null>(null)

const selectedVersion = computed(() => {
  return versions.value.find((v) => v.id === selectedVersionId.value)
})

async function fetchVersions() {
  if (!resumeId || resumeId === 'new') return
  loadingVersions.value = true
  try {
    const data = await $fetch<any[]>(`/api/builder/resume/${resumeId}/versions`)
    versions.value = data
  } catch (e) {
    console.error('Failed to load version history:', e)
  } finally {
    loadingVersions.value = false
  }
}

async function revertToVersion(versionId: string) {
  const ok = await confirmDialog.confirm({
    title: 'Revert Document',
    message: 'Are you sure you want to revert your resume to this version? Any unsaved manual changes will be lost.',
    confirmLabel: 'Revert',
    danger: true,
  })
  if (!ok) return

  reverting.value = true
  try {
    const result = await $fetch<any>(`/api/builder/resume/${resumeId}/revert`, {
      method: 'POST',
      body: { versionId }
    })
    if (result.success && result.content) {
      resumeData.value = result.content
      toast.success('Successfully reverted to selected version!')
      selectedVersionId.value = null
      await fetchVersions()
    }
  } catch (e) {
    console.error(e)
    toast.error('Failed to revert to the selected version.')
  } finally {
    reverting.value = false
  }
}

async function saveDraftWithLabel(label: string) {
  saving.value = true
  try {
    const payload = withLayoutState(resumeData.value)
    resumeData.value = payload
    if (resumeId === 'new') {
      const { id } = await $fetch<{ id: string }>('/api/builder/resume', {
        method: 'POST',
        body: { ...payload, versionLabel: label },
      })
      router.replace(`/builder/resume/${id}`)
    } else {
      await $fetch(`/api/builder/resume/${resumeId}`, {
        method: 'PUT',
        body: { ...payload, versionLabel: label },
      })
    }
    void fetchVersions()
  } catch (e) {
    console.error(e)
    const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(err.data?.statusMessage || err.statusMessage || 'Failed to save draft.')
  } finally {
    saving.value = false
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
        body: { ...payload, versionLabel: 'Initial Draft' },
      })
      router.replace(`/builder/resume/${id}`)
    } else {
      await $fetch(`/api/builder/resume/${resumeId}`, {
        method: 'PUT',
        body: { ...payload, versionLabel: 'Manual Edit' },
      })
    }
    toast.success('Saved successfully.')
    void fetchVersions()
  } catch (e) {
    console.error(e)
    const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(err.data?.statusMessage || err.statusMessage || 'Failed to save draft.')
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

async function enhanceDescription(item: { id: string, title?: string, description?: string, targetRole?: string, commandPrompt?: string, projectDescription?: string }, type: 'experience' | 'project' | 'summary') {
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
        experiences: type === 'summary' ? resumeData.value.experience : undefined,
        targetRole: item.targetRole || '',
        commandPrompt: item.commandPrompt || '',
        projectDescription: item.projectDescription || '',
        useMetrics: resumeData.value.useMetrics === true,
      }
    })

    const html = normalizeEnhancedHtml(result.enhancedDescription, type !== 'summary')
    
    if (type === 'summary') {
      const previous = resumeData.value.personalInfo.summary
      pushAiUndo('summary', 'Undo summary enhance', () => {
        resumeData.value.personalInfo.summary = previous
      })
      resumeData.value.personalInfo.summary = html
    } else if (type === 'experience') {
      const idx = resumeData.value.experience.findIndex((e) => e.id === item.id)
      if (idx >= 0) {
        const previous = resumeData.value.experience[idx]!.description
        const scope = `experience:${item.id}`
        pushAiUndo(scope, 'Undo experience enhance', () => {
          const i = resumeData.value.experience.findIndex((e) => e.id === item.id)
          if (i >= 0) resumeData.value.experience[i]!.description = previous
        })
        resumeData.value.experience[idx]!.description = html
      }
    } else if (type === 'project') {
      const idx = resumeData.value.projects.findIndex((p) => p.id === item.id)
      if (idx >= 0) {
        const previous = resumeData.value.projects[idx]!.description || ''
        const scope = `project:${item.id}`
        pushAiUndo(scope, 'Undo project enhance', () => {
          const i = resumeData.value.projects.findIndex((p) => p.id === item.id)
          if (i >= 0) resumeData.value.projects[i]!.description = previous
        })
        resumeData.value.projects[idx]!.description = html
      }
    }
    await nextTick()
    notifyAiSuccess('Description enhanced. 1 credit used.')
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
    id: newId(), title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '', targetRole: '', commandPrompt: ''
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
    id: newId(), title: '', description: '', projectDescription: '', isCurrent: false, targetRole: '', commandPrompt: ''
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

function applySuggestedRewrite(section: 'experience' | 'projects' | 'skills' | 'summary', original: string, suggested: string) {
  if (section === 'summary') {
    resumeData.value.personalInfo.summary = suggested
    toast.success('Summary updated with suggested rewrite.')
  } else if (section === 'experience') {
    const cleanOriginal = original.replace(/<[^>]+>/g, '').trim()
    for (let i = 0; i < resumeData.value.experience.length; i++) {
      const exp = resumeData.value.experience[i]
      if (exp.description.includes(original) || exp.description.replace(/<[^>]+>/g, '').includes(cleanOriginal)) {
        exp.description = exp.description.replace(original, suggested)
        toast.success('Experience bullet updated.')
        return
      }
    }
    // Try word-based matching if direct replacement fails
    toast.error('Could not find the exact matching bullet in experience, but you can copy/paste it.')
  } else if (section === 'projects') {
    const cleanOriginal = original.replace(/<[^>]+>/g, '').trim()
    for (let i = 0; i < resumeData.value.projects.length; i++) {
      const proj = resumeData.value.projects[i]
      if (proj.description && (proj.description.includes(original) || proj.description.replace(/<[^>]+>/g, '').includes(cleanOriginal))) {
        proj.description = proj.description.replace(original, suggested)
        toast.success('Project bullet updated.')
        return
      }
    }
    toast.error('Could not find the exact matching bullet in projects, but you can copy/paste it.')
  } else if (section === 'skills') {
    const exists = resumeData.value.skills.some(s => s.name.toLowerCase() === suggested.toLowerCase())
    if (!exists) {
      resumeData.value.skills.push({ id: newId(), name: suggested })
      toast.success(`Added skill: ${suggested}`)
    } else {
      toast.info(`Skill "${suggested}" already exists.`)
    }
  }
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
          :aria-label="t('builderUi.goBack')"
          @click="goBack"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 cursor-pointer"
          :aria-label="t('builderUi.openSections')"
          @click="mobileNavOpen = !mobileNavOpen"
        >
          <span class="material-symbols-outlined">{{ mobileNavOpen ? 'close' : 'menu' }}</span>
        </button>
        <AppLogo size="sm" :show-tagline="false" class="truncate" />
        <nav class="hidden lg:flex gap-6 items-center">
          <NuxtLink to="/builder" class="font-semibold text-slate-300 hover:text-white transition-colors duration-200">{{ t('builderUi.myProjects') }}</NuxtLink>
          <NuxtLink to="/builder/templates" class="font-semibold text-slate-300 hover:text-white transition-colors duration-200">{{ t('builderUi.templates') }}</NuxtLink>
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
          <input type="text" v-model="resumeData.name" class="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all w-28 lg:w-40" :placeholder="t('builderUi.resumeNamePlaceholder')" />
        </div>
        
        <input type="file" ref="importFileInput" class="hidden" accept=".pdf,.docx,.doc,.txt" @change="handleImportResume" />
        <input type="file" ref="draftFileInput" class="hidden" accept=".pdf,.docx,.doc,.txt,.md" @change="handleDraftResumeUpload" />
        <button @click="triggerImport" :disabled="importing || saving || exporting" class="px-2.5 sm:px-4 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 rounded hover:bg-indigo-500 hover:text-white transition-colors font-semibold text-sm disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <span class="material-symbols-outlined text-[16px]" :class="{'animate-spin': importing}">
            {{ importing ? 'refresh' : 'upload_file' }}
          </span>
          <span class="hidden md:inline">{{ importing ? t('builderUi.importing') : t('builderUi.importResume') }}</span>
        </button>

        <button
          v-if="canUndoAi"
          type="button"
          class="px-2.5 sm:px-3 py-1.5 bg-amber-500/15 text-amber-200 border border-amber-500/40 rounded hover:bg-amber-500/25 transition-colors font-semibold text-sm cursor-pointer inline-flex items-center gap-1"
          :title="lastAiUndoLabel"
          @click="() => { const entry = undoAi(); if (entry) toast.info(`Reverted: ${entry.label}`) }"
        >
          <span class="material-symbols-outlined text-[16px]">undo</span>
          <span class="hidden sm:inline">{{ t('builderUi.undoAi') }}</span>
        </button>
        <button @click="saveDraft" :disabled="saving" class="px-2.5 sm:px-4 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded hover:bg-blue-500 hover:text-white transition-colors font-semibold text-sm disabled:opacity-50 cursor-pointer">
          <span class="sm:hidden">{{ saving ? '…' : t('builderUi.save') }}</span>
          <span class="hidden sm:inline">{{ saving ? t('builderUi.saving') : t('builderUi.saveDraft') }}</span>
        </button>
        <button @click="showApplyModal = true" class="px-2.5 sm:px-4 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors font-semibold text-sm shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-pointer inline-flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]">mail</span>
          <span class="hidden sm:inline">{{ t('builderUi.applyViaEmail') }}</span>
          <span class="sm:hidden">{{ t('builderUi.apply') }}</span>
        </button>
        <button @click="exportPdf" :disabled="exporting" class="px-2.5 sm:px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-semibold text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer disabled:opacity-50">
          <span class="sm:hidden">{{ exporting ? '…' : t('builderUi.pdf') }}</span>
          <span class="hidden sm:inline">{{ exporting ? t('builderUi.exporting') : t('builderUi.exportPdf') }}</span>
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
        {{ t('builderUi.edit') }}
      </button>
      <button
        type="button"
        class="flex-1 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
        :class="mobilePane === 'preview' ? 'text-blue-300 border-b-2 border-blue-400 bg-blue-500/10' : 'text-slate-400'"
        @click="mobilePane = 'preview'"
      >
        {{ t('builderUi.preview') }}
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
                >{{ t('builderUi.pro') }}</span>
              </button>
            </li>
          </ul>
          <div class="mt-4 pt-4 mx-2 border-t border-white/10">
            <button
              type="button"
              class="w-full flex items-center gap-4 px-4 py-3 text-sm transition-all cursor-pointer text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
              @click="goToApplyEmailPage"
            >
              <span class="material-symbols-outlined">mail</span>
              <span class="flex-1 text-left font-semibold">{{ t('builderUi.applyViaEmail') }}</span>
              <span class="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{{ t('builderUi.pro') }}</span>
            </button>
          </div>
        </nav>
      </aside>

      <!-- Mobile section drawer -->
      <div v-if="mobileNavOpen" class="fixed inset-0 z-40 lg:hidden">
        <button type="button" class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" :aria-label="t('builderUi.closeSections')" @click="mobileNavOpen = false" />
        <aside class="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-slate-900 border-r border-white/10 py-4 overflow-y-auto shadow-2xl">
          <p class="px-5 mb-3 text-xs uppercase tracking-widest text-blue-200/60 font-semibold">{{ t('builderUi.sections') }}</p>
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
            <div class="mt-4 pt-4 mx-1 border-t border-white/10">
              <button
                type="button"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm cursor-pointer text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                @click="goToApplyEmailPage"
              >
                <span class="material-symbols-outlined">mail</span>
                <span class="flex-1 text-left font-semibold">{{ t('builderUi.applyViaEmail') }}</span>
              </button>
            </div>
          </nav>
          <div class="px-5 pt-4 mt-2 border-t border-white/10 space-y-2 sm:hidden">
            <label class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">{{ t('builderUi.language') }}</label>
            <select v-model="resumeData.language" @change="handleLanguageChange" class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none cursor-pointer">
              <option value="en" class="bg-slate-800">EN</option>
              <option value="de" class="bg-slate-800">DE</option>
              <option value="fr" class="bg-slate-800">FR</option>
              <option value="es" class="bg-slate-800">ES</option>
            </select>
            <label class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold pt-1">{{ t('builderUi.name') }}</label>
            <input type="text" v-model="resumeData.name" class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none" :placeholder="t('builderUi.resumeNamePlaceholder')" />
          </div>
        </aside>
      </div>

      <!-- Main Content Canvas -->
      <main class="flex-1 flex overflow-hidden min-w-0">
        <!-- Left Pane: Editor Form -->
        <section
          class="h-full flex-col bg-slate-900/40 backdrop-blur-md border-r border-white/10 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar relative w-full lg:w-[40%]"
          :class="mobilePane === 'edit' ? 'flex' : 'hidden lg:flex'"
          @click="activePopoverId = null"
        >
          
          <div v-if="activeTab === 'template'">
            <div class="mb-8">
              <h1 class="font-bold text-2xl text-white mb-1">{{ t('builderUi.chooseTemplate') }}</h1>
              <p class="text-blue-200/60 text-sm">{{ t('builderUi.templateHelpResume') }}</p>
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
                    {{ t('builderUi.selected') }}
                  </div>
                </div>
                <div class="p-3 bg-white/5">
                  <h3 class="font-bold text-white text-sm mb-0.5 group-hover:text-blue-300 transition-colors">{{ tpl.name }}</h3>
                  <p class="text-[11px] text-slate-400 leading-snug">{{ resumeDesc(tpl.id, tpl.desc) }}</p>
                </div>
              </button>
            </div>
            <!-- Spacing & Typography Presets -->
            <div class="mt-8 pt-6 border-t border-white/10 space-y-4 text-left">
              <div>
                <h3 class="font-bold text-lg text-white mb-0.5">{{ t('builderUi.spacingTypography') }}</h3>
                <p class="text-blue-200/60 text-xs">{{ t('builderUi.spacingHelp') }}</p>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="applySpacingPreset('ats-stable')"
                  :class="['px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer', (resumeData.spacingPreset || 'balanced') === 'ats-stable' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-white/5 text-slate-300 border-white/10 hover:border-blue-400/50']"
                >
                  {{ t('builderUi.presetAtsStable') }}
                </button>
                <button
                  type="button"
                  @click="applySpacingPreset('balanced')"
                  :class="['px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer', (resumeData.spacingPreset || 'balanced') === 'balanced' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-white/5 text-slate-300 border-white/10 hover:border-blue-400/50']"
                >
                  {{ t('builderUi.presetBalanced') }}
                </button>
                <button
                  type="button"
                  @click="applySpacingPreset('compact')"
                  :class="['px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer', (resumeData.spacingPreset || 'balanced') === 'compact' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-white/5 text-slate-300 border-white/10 hover:border-blue-400/50']"
                >
                  {{ t('builderUi.presetCompact') }}
                </button>
              </div>

              <div class="space-y-4 pt-2">
                <label class="block space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-semibold uppercase tracking-wider text-slate-400">{{ t('builderUi.fontSize') }}</span>
                    <span class="text-slate-300 tabular-nums">{{ layoutSliderValue('fontSize', 9.5).toFixed(1) }} pt</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="12"
                    step="0.5"
                    :value="layoutSliderValue('fontSize', 9.5)"
                    class="w-full accent-blue-500 cursor-pointer"
                    @input="resumeData.fontSize = Number(($event.target as HTMLInputElement).value)"
                  />
                </label>

                <label class="block space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-semibold uppercase tracking-wider text-slate-400">{{ t('builderUi.lineHeight') }}</span>
                    <span class="text-slate-300 tabular-nums">{{ layoutSliderValue('lineHeight', 1.35).toFixed(2) }}</span>
                  </div>
                  <input
                    type="range"
                    min="1.15"
                    max="1.7"
                    step="0.05"
                    :value="layoutSliderValue('lineHeight', 1.35)"
                    class="w-full accent-blue-500 cursor-pointer"
                    @input="resumeData.lineHeight = Number(($event.target as HTMLInputElement).value)"
                  />
                </label>

                <label class="block space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-semibold uppercase tracking-wider text-slate-400">{{ t('builderUi.marginH') }}</span>
                    <span class="text-slate-300 tabular-nums">{{ layoutSliderValue('marginHorizontal', 32) }} pt</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="56"
                    step="2"
                    :value="layoutSliderValue('marginHorizontal', 32)"
                    class="w-full accent-blue-500 cursor-pointer"
                    @input="resumeData.marginHorizontal = Number(($event.target as HTMLInputElement).value)"
                  />
                </label>

                <label class="block space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-semibold uppercase tracking-wider text-slate-400">{{ t('builderUi.marginV') }}</span>
                    <span class="text-slate-300 tabular-nums">{{ layoutSliderValue('marginVertical', 32) }} pt</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="56"
                    step="2"
                    :value="layoutSliderValue('marginVertical', 32)"
                    class="w-full accent-blue-500 cursor-pointer"
                    @input="resumeData.marginVertical = Number(($event.target as HTMLInputElement).value)"
                  />
                </label>
              </div>
            </div>
            <!-- Design customization -->
            <div class="mt-8 pt-6 border-t border-white/10">
              <div class="mb-4">
                <h3 class="font-bold text-lg text-white mb-0.5">{{ t('builderUi.design') }}</h3>
                <p class="text-blue-200/60 text-xs">{{ t('builderUi.designHelp') }}</p>
              </div>
              <BuilderDesignPanel v-model="resumeData" />
            </div>
          </div>

          <div v-if="activeTab === 'layout'" class="space-y-6">
            <div class="mb-2">
              <h1 class="font-bold text-2xl text-white mb-1">{{ t('builderUi.sectionOrderTitle') }}</h1>
              <p class="text-blue-200/60 text-sm">
                {{ t('builderUi.sectionOrderHelp') }}
              </p>
            </div>
            <BuilderPdfSectionReorderPanel
              v-model="sectionsOrderModel"
              :custom-sections="resumeData.customSections"
            />
          </div>

          <div v-if="activeTab === 'personalInfo'">
            <div class="mb-8">
              <h1 class="font-bold text-2xl text-white mb-1">{{ t('builderUi.personalInfoTitle') }}</h1>
              <p class="text-blue-200/60 text-sm">{{ t('builderUi.personalInfoHelp') }}</p>
            </div>
            <div class="space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.fullName') }}</label>
                  <input v-model="resumeData.personalInfo.fullName" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.jobTitle') }}</label>
                  <input v-model="resumeData.personalInfo.jobTitle" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.email') }}</label>
                  <input v-model="resumeData.personalInfo.email" type="email" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.phone') }}</label>
                  <input v-model="resumeData.personalInfo.phone" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.location') }}</label>
                  <input v-model="resumeData.personalInfo.location" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.portfolioWebsite') }}</label>
                  <input v-model="resumeData.personalInfo.portfolio" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.linkedin') }}</label>
                  <input
                    v-model="resumeData.personalInfo.linkedin"
                    type="text"
                    :placeholder="t('builderFields.linkedinPlaceholder')"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all"
                  />
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.github') }}</label>
                  <input
                    v-model="resumeData.personalInfo.github"
                    type="text"
                    :placeholder="t('builderFields.githubPlaceholder')"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all"
                  />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.targetRoleOptional') }}</label>
                  <textarea v-model="resumeData.personalInfo.targetRole" rows="2" :placeholder="t('builderFields.targetRolePlaceholder')" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all text-sm resize-y"></textarea>
                </div>
                <div class="flex flex-col">
                  <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.aiInstructionsOptional') }}</label>
                  <input v-model="resumeData.personalInfo.commandPrompt" type="text" :placeholder="t('builderFields.aiHintPlaceholder')" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all text-sm" />
                </div>
              </div>

              <div class="flex flex-col relative">
                <div class="flex justify-between items-end mb-1">
                  <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{{ t('builderFields.professionalSummary') }} <span class="text-blue-400 normal-case ml-2">{{ t('builderUi.richTextSupported') }}</span></label>
                  <div class="flex items-center gap-1.5 z-10">
                    <button
                      v-if="canUndoAiScope('summary')"
                      type="button"
                      class="text-[10px] flex items-center gap-1 bg-amber-500/15 text-amber-200 hover:bg-amber-500/30 px-2 py-1 rounded border border-amber-500/30 transition-colors cursor-pointer"
                      @click="() => { const entry = undoAiScope('summary'); if (entry) toast.info('Summary enhance undone.') }"
                    >
                      <span class="material-symbols-outlined text-[12px]">undo</span>
                      {{ t('builderUi.undo') }}
                    </button>
                    <button @click="enhanceDescription({ id: 'summary', description: resumeData.personalInfo.summary, targetRole: resumeData.personalInfo.targetRole, commandPrompt: resumeData.personalInfo.commandPrompt }, 'summary')" :disabled="enhancingIds.has('summary')" class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 cursor-pointer">
                      <span class="material-symbols-outlined text-[12px]" :class="{'animate-spin': enhancingIds.has('summary')}">{{ enhancingIds.has('summary') ? 'refresh' : 'auto_awesome' }}</span>
                      {{ enhancingIds.has('summary') ? t('builderUi.enhancing') : t('builderUi.aiEnhance') }}
                    </button>
                  </div>
                </div>
                <div class="bg-white/5 rounded border border-white/10">
                  <BuilderRichTextEditor
                    :key="'summary-editor'"
                    v-model="resumeData.personalInfo.summary"
                  />
                </div>

                <!-- Summary Keyword Assistance -->
                <div class="mt-3 space-y-1.5 text-left">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ t('builderUi.keywordsInSummary') }}</span>
                    <span class="text-[10px] text-slate-400 font-semibold">{{ t('builderUi.coveredCount', { n: liveKeywordMatches.filter(k => k.isCovered && k.locations.some(loc => loc.section === 'Summary')).length }) }}</span>
                  </div>
                  <div v-if="!liveKeywordMatches.length" class="text-[10px] text-slate-500 italic">{{ t('builderUi.noKeywordsYet') }}</div>
                  <div v-else class="flex flex-wrap gap-1">
                    <span
                      v-for="m in liveKeywordMatches"
                      :key="`sum-kw-${m.keyword}`"
                      class="text-[9px] px-2 py-0.5 rounded-full border transition-all"
                      :class="m.locations.some(loc => loc.section === 'Summary') ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800/40 text-slate-500 border-white/5'"
                    >
                      {{ m.keyword }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'targetRole'" class="pb-8">
            <div class="mb-8">
              <h1 class="font-bold text-2xl text-white mb-1">{{ t('builderUi.targetRoleTitle') }}</h1>
              <p class="text-blue-200/60 text-sm">
                {{ t('builderUi.targetRoleHelpResume') }}
              </p>
            </div>
            <ExtensionInstallBanner class="mb-5" />
            <div class="space-y-5">
              <div class="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div class="flex items-start justify-between gap-3 flex-wrap">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-white">{{ t('builderUi.resumeForDrafting') }}</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">
                      {{
                        uploadedResumeName ||
                        (hasResumeSignal()
                          ? t('builderUi.usingProjectResume')
                          : t('builderUi.uploadOptional'))
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
                    {{ importing ? t('builderUi.importing') : t('builderUi.uploadResume') }}
                  </button>
                </div>
              </div>

              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  {{ t('builderUi.jobDescription') }}
                </label>
                <textarea
                  v-model="resumeData.targetJobDescription"
                  class="w-full h-48 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all resize-none custom-scrollbar"
                  :placeholder="t('builderUi.jobDescPlaceholder')"
                />
              </div>

              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  {{ t('builderUi.aiInstructions') }}
                </label>
                <textarea
                  v-model="resumeData.additionalInstructions"
                  class="w-full h-28 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:bg-white/10 text-white outline-none transition-all resize-none custom-scrollbar"
                  :placeholder="t('builderUi.aiInstructionsPlaceholder')"
                />
                <p class="mt-1.5 text-[11px] text-slate-500">{{ t('builderUi.aiInstructionsHelp') }}</p>
              </div>

              <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-1.5">
                <label class="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    class="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/40"
                    :checked="resumeData.useMetrics === true"
                    @change="resumeData.useMetrics = ($event.target as HTMLInputElement).checked"
                  >
                  <span class="text-sm font-semibold text-slate-200">{{ $t('metrics.label') }}</span>
                </label>
                <p class="text-[11px] text-slate-500 pl-7">{{ $t('metrics.hint') }}</p>
              </div>

              <!-- Tailoring Preset Selector -->
              <div class="space-y-2 text-left">
                <label class="text-xs font-bold uppercase tracking-widest text-slate-500 block">
                  {{ t('builderUi.tailoringPreset') }}
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    @click="tailoringPreset = 'ats-first'"
                    :class="['px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer', tailoringPreset === 'ats-first' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-white/5 text-slate-300 border-white/10 hover:border-blue-400/50']"
                  >
                    {{ t('builderUi.presetAts') }}
                  </button>
                  <button
                    type="button"
                    @click="tailoringPreset = 'impact-first'"
                    :class="['px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer', tailoringPreset === 'impact-first' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-white/5 text-slate-300 border-white/10 hover:border-blue-400/50']"
                  >
                    {{ t('builderUi.presetImpact') }}
                  </button>
                  <button
                    type="button"
                    @click="tailoringPreset = 'leadership'"
                    :class="['px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer', tailoringPreset === 'leadership' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-white/5 text-slate-300 border-white/10 hover:border-blue-400/50']"
                  >
                    {{ t('builderUi.presetLeadership') }}
                  </button>
                  <button
                    type="button"
                    @click="tailoringPreset = 'tech-expert'"
                    :class="['px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer', tailoringPreset === 'tech-expert' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-white/5 text-slate-300 border-white/10 hover:border-blue-400/50']"
                  >
                    {{ t('builderUi.presetTech') }}
                  </button>
                </div>
                <p class="text-[10px] text-slate-500 leading-snug">
                  <span v-if="tailoringPreset === 'ats-first'">{{ t('builderUi.presetAtsHelp') }}</span>
                  <span v-if="tailoringPreset === 'impact-first'">{{ t('builderUi.presetImpactHelp') }}</span>
                  <span v-if="tailoringPreset === 'leadership'">{{ t('builderUi.presetLeadershipHelp') }}</span>
                  <span v-if="tailoringPreset === 'tech-expert'">{{ t('builderUi.presetTechHelp') }}</span>
                </p>
              </div>

              <div class="flex items-center gap-2 py-1 select-none">
                <input
                  id="also-generate-cover-letter"
                  v-model="alsoGenerateCoverLetter"
                  type="checkbox"
                  class="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/50 outline-none cursor-pointer"
                />
                <label for="also-generate-cover-letter" class="text-xs font-medium text-slate-300 cursor-pointer">
                  {{ t('builderUi.alsoCoverLetter') }}
                </label>
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
                {{ enhancing ? t('builderUi.drafting') : t('builderUi.draftResume') }}
              </button>

              <div
                v-if="route.query.jobId"
                class="flex flex-wrap gap-2 pt-1"
              >
                <NuxtLink
                  :to="`/builder/cover-letter/new?jobId=${encodeURIComponent(String(route.query.jobId))}`"
                  class="text-[11px] px-3 py-1.5 rounded-lg border border-white/15 text-slate-300 hover:border-blue-400 hover:text-white transition-colors"
                >
                  {{ t('builderUi.coverLetterBuilder') }}
                </NuxtLink>
                <NuxtLink
                  :to="`/dashboard/portfolio?jobId=${encodeURIComponent(String(route.query.jobId))}`"
                  class="text-[11px] px-3 py-1.5 rounded-lg border border-white/15 text-slate-300 hover:border-blue-400 hover:text-white transition-colors"
                >
                  {{ t('builderUi.portfolio') }}
                </NuxtLink>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'experience'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">{{ t('builderUi.experienceTitle') }}</h1>
                <p class="text-blue-200/60 text-sm">{{ t('builderUi.experienceHelp') }}</p>
              </div>
              <button @click="addExperience" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> {{ t('builderUi.add') }}
              </button>
            </div>
            <div class="space-y-8 pb-10">
              <div v-for="(exp, index) in resumeData.experience" :key="exp.id" class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors">
                <button @click="removeExperience(index)" class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10">delete</button>
                <div class="space-y-5 mt-2">
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.jobTitle') }}</label>
                    <input v-model="exp.title" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" />
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.company') }}</label>
                      <div class="flex items-center gap-2 relative">
                        <input v-model="exp.company" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                        <button @click.stop="activePopoverId = activePopoverId === exp.id ? null : exp.id" class="text-slate-400 hover:text-blue-400 material-symbols-outlined text-[16px] transition-colors" :class="{'text-blue-400': exp.companyWebsite || activePopoverId === exp.id}">link</button>
                        
                        <!-- Slack-style Link Popover -->
                        <div v-if="activePopoverId === exp.id" @click.stop class="absolute top-full right-0 mt-2 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 w-72">
                          <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block">{{ t('builderFields.linkUrl') }}</label>
                          <input v-model="exp.companyWebsite" :placeholder="t('builderFields.httpsPlaceholder')" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm mb-3 text-white outline-none focus:border-blue-500 transition-colors" />
                          <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block">{{ t('builderFields.displayText') }}</label>
                          <input v-model="exp.companyWebsiteName" :placeholder="t('builderFields.displayTextOptional')" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.location') }}</label>
                      <input v-model="exp.location" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.startDate') }}</label>
                      <input v-model="exp.startDate" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.endDate') }}</label>
                      <input v-if="!exp.isCurrent" v-model="exp.endDate" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                      <div v-else class="py-1 text-blue-300 font-semibold text-sm">{{ t('builderUi.present') }}</div>
                      <label class="flex items-center gap-2 mt-2 cursor-pointer w-max">
                        <input type="checkbox" v-model="exp.isCurrent" class="accent-blue-500 w-4 h-4 rounded border-white/20" />
                        <span class="text-xs text-slate-300">{{ t('builderUi.currentlyWorkHere') }}</span>
                      </label>
                    </div>
                  </div>
                  <!-- AI Enhance Helpers for Experience -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/5 p-3 rounded-lg border border-white/5">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.targetRoleOptional') }}</label>
                      <textarea v-model="exp.targetRole" rows="2" :placeholder="t('builderFields.targetRolePlaceholder')" class="w-full bg-transparent border border-white/20 rounded-lg p-2 focus:border-blue-400 text-white outline-none transition-colors text-sm resize-y" @click.stop></textarea>
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.aiInstructionsOptional') }}</label>
                      <input v-model="exp.commandPrompt" type="text" :placeholder="t('builderFields.aiHintPlaceholder')" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors text-sm" />
                    </div>
                  </div>

                  <div class="flex flex-col relative">
                    <div class="flex justify-between items-end mb-1">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{{ t('builderUi.descriptionBullets') }}</label>
                      <div class="flex items-center gap-1.5 z-10">
                        <button
                          v-if="canUndoAiScope(`experience:${exp.id}`)"
                          type="button"
                          class="text-[10px] flex items-center gap-1 bg-amber-500/15 text-amber-200 hover:bg-amber-500/30 px-2 py-1 rounded border border-amber-500/30 transition-colors cursor-pointer"
                          @click="() => { const entry = undoAiScope(`experience:${exp.id}`); if (entry) toast.info('Experience enhance undone.') }"
                        >
                          <span class="material-symbols-outlined text-[12px]">undo</span>
                          {{ t('builderUi.undo') }}
                        </button>
                        <button @click="enhanceDescription(exp, 'experience')" :disabled="enhancingIds.has(exp.id)" class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 cursor-pointer">
                          <span class="material-symbols-outlined text-[12px]" :class="{'animate-spin': enhancingIds.has(exp.id)}">{{ enhancingIds.has(exp.id) ? 'refresh' : 'auto_awesome' }}</span>
                          {{ enhancingIds.has(exp.id) ? t('builderUi.enhancing') : t('builderUi.aiEnhance') }}
                        </button>
                      </div>
                    </div>
                    <div class="bg-white/5 rounded border border-white/10">
                      <BuilderBulletDescriptionEditor
                        :key="`exp-desc-${exp.id}`"
                        v-model="resumeData.experience[index].description"
                      />
                    </div>

                    <SyncToLinkedIn
                      :experience="exp"
                      :pdf-export="downloadPreviewPdf"
                    />

                    <!-- Experience Bullet Keyword Assistance -->
                    <div class="mt-3 space-y-1.5 text-left">
                      <div class="flex items-center justify-between">
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ t('builderUi.keywordsInSection') }}</span>
                        <span class="text-[10px] text-slate-400 font-semibold">{{ t('builderUi.coveredCount', { n: liveKeywordMatches.filter(m => m.isCovered && m.locations.some(loc => loc.section === 'Experience' && loc.title.includes(exp.title || 'Role'))).length }) }}</span>
                      </div>
                      <div v-if="!liveKeywordMatches.length" class="text-[10px] text-slate-500 italic">{{ t('builderUi.noKeywordsYet') }}</div>
                      <div v-else class="flex flex-wrap gap-1">
                        <span
                          v-for="m in liveKeywordMatches"
                          :key="`exp-kw-${exp.id}-${m.keyword}`"
                          class="text-[9px] px-2 py-0.5 rounded-full border transition-all"
                          :class="m.locations.some(loc => loc.section === 'Experience' && loc.title.includes(exp.title || 'Role')) ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800/40 text-slate-500 border-white/5'"
                        >
                          {{ m.keyword }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'projects'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">{{ t('builderUi.projectsTitle') }}</h1>
                <p class="text-blue-200/60 text-sm">{{ t('builderUi.projectsHelp') }}</p>
              </div>
              <button @click="addProject" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> {{ t('builderUi.add') }}
              </button>
            </div>
            <div class="space-y-8 pb-10">
              <div v-for="(proj, index) in resumeData.projects" :key="proj.id" class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors">
                <button @click="removeProject(index)" class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10">delete</button>
                <div class="space-y-5 mt-2">
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.itemTitle') }}</label>
                    <div class="flex items-center gap-2 relative">
                      <input v-model="proj.title" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" />
                      <button @click.stop="activePopoverId = activePopoverId === proj.id ? null : proj.id" class="text-slate-400 hover:text-blue-400 material-symbols-outlined text-[16px] transition-colors" :class="{'text-blue-400': proj.linkUrl || activePopoverId === proj.id}">link</button>
                      
                      <!-- Slack-style Link Popover -->
                      <div v-if="activePopoverId === proj.id" @click.stop class="absolute top-full right-0 mt-2 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 w-72">
                        <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block">{{ t('builderFields.linkUrl') }}</label>
                        <input v-model="proj.linkUrl" :placeholder="t('builderFields.httpsPlaceholder')" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm mb-3 text-white outline-none focus:border-blue-500 transition-colors" />
                        <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1 block">{{ t('builderFields.displayText') }}</label>
                        <input v-model="proj.linkName" :placeholder="t('builderFields.displayTextOptional')" class="w-full bg-black/50 border border-slate-600 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.organizationClient') }}</label>
                      <input v-model="proj.organization" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.location') }}</label>
                      <input v-model="proj.location" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.startDate') }}</label>
                      <input v-model="proj.startDate" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.endDate') }}</label>
                      <input v-if="!proj.isCurrent" v-model="proj.endDate" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                      <div v-else class="py-1 text-blue-300 font-semibold text-sm">{{ t('builderUi.present') }}</div>
                      <label class="flex items-center gap-2 mt-2 cursor-pointer w-max">
                        <input type="checkbox" v-model="proj.isCurrent" class="accent-blue-500 w-4 h-4 rounded border-white/20" />
                        <span class="text-xs text-slate-300">{{ t('builderUi.currentlyWorkHere') }}</span>
                      </label>
                    </div>
                  </div>
                  <!-- AI Enhance Helpers for Project -->
                  <div class="grid grid-cols-1 gap-4 bg-white/5 p-4 rounded-lg border border-white/5">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.describeProject') }}</label>
                      <textarea v-model="proj.projectDescription" rows="2" placeholder="e.g. Built a real-time metrics dashboard using Nuxt 3 and WebSockets to monitor server resources, processing 5K requests/sec." class="w-full bg-transparent border border-white/20 rounded-lg p-2 focus:border-blue-400 text-white outline-none transition-colors text-sm resize-y" @click.stop></textarea>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div class="flex flex-col">
                        <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.targetRoleOptional') }}</label>
                        <input v-model="proj.targetRole" type="text" :placeholder="t('builderFields.targetRolePlaceholder')" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors text-sm" />
                      </div>
                      <div class="flex flex-col">
                        <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.aiInstructionsOptional') }}</label>
                        <input v-model="proj.commandPrompt" type="text" :placeholder="t('builderFields.aiHintPlaceholder')" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors text-sm" />
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-col relative">
                    <div class="flex justify-between items-end mb-1">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{{ t('builderUi.descriptionBullets') }}</label>
                      <div class="flex items-center gap-1.5 z-10">
                        <button
                          v-if="canUndoAiScope(`project:${proj.id}`)"
                          type="button"
                          class="text-[10px] flex items-center gap-1 bg-amber-500/15 text-amber-200 hover:bg-amber-500/30 px-2 py-1 rounded border border-amber-500/30 transition-colors cursor-pointer"
                          @click="() => { const entry = undoAiScope(`project:${proj.id}`); if (entry) toast.info('Project enhance undone.') }"
                        >
                          <span class="material-symbols-outlined text-[12px]">undo</span>
                          {{ t('builderUi.undo') }}
                        </button>
                        <button @click="enhanceDescription(proj, 'project')" :disabled="enhancingIds.has(proj.id)" class="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-2 py-1 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 cursor-pointer">
                          <span class="material-symbols-outlined text-[12px]" :class="{'animate-spin': enhancingIds.has(proj.id)}">{{ enhancingIds.has(proj.id) ? 'refresh' : 'auto_awesome' }}</span>
                          {{ enhancingIds.has(proj.id) ? t('builderUi.enhancing') : t('builderUi.aiEnhance') }}
                        </button>
                      </div>
                    </div>
                    <div class="bg-white/5 rounded border border-white/10">
                      <BuilderBulletDescriptionEditor
                        :key="`proj-desc-${proj.id}`"
                        v-model="resumeData.projects[index].description"
                      />
                    </div>

                    <!-- Project Bullet Keyword Assistance -->
                    <div class="mt-3 space-y-1.5 text-left">
                      <div class="flex items-center justify-between">
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ t('builderUi.keywordsInSection') }}</span>
                        <span class="text-[10px] text-slate-400 font-semibold">{{ t('builderUi.coveredCount', { n: liveKeywordMatches.filter(m => m.isCovered && m.locations.some(loc => loc.section === 'Projects' && loc.title.includes(proj.title || 'Project'))).length }) }}</span>
                      </div>
                      <div v-if="!liveKeywordMatches.length" class="text-[10px] text-slate-500 italic">{{ t('builderUi.noKeywordsYet') }}</div>
                      <div v-else class="flex flex-wrap gap-1">
                        <span
                          v-for="m in liveKeywordMatches"
                          :key="`proj-kw-${proj.id}-${m.keyword}`"
                          class="text-[9px] px-2 py-0.5 rounded-full border transition-all"
                          :class="m.locations.some(loc => loc.section === 'Projects' && loc.title.includes(proj.title || 'Project')) ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800/40 text-slate-500 border-white/5'"
                        >
                          {{ m.keyword }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'education'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">{{ t('builderUi.educationTitle') }}</h1>
                <p class="text-blue-200/60 text-sm">{{ t('builderUi.educationHelp') }}</p>
              </div>
              <button @click="addEducation" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> {{ t('builderUi.add') }}
              </button>
            </div>
            <div class="space-y-8 pb-10">
              <div v-for="(edu, index) in resumeData.education" :key="edu.id" class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors">
                <button @click="removeEducation(index)" class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10">delete</button>
                <div class="space-y-5 mt-2">
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.degreeProgram') }}</label>
                    <input v-model="edu.degree" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" />
                  </div>
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.schoolUniversity') }}</label>
                    <input v-model="edu.school" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.location') }}</label>
                      <input v-model="edu.location" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.graduationDate') }}</label>
                      <input v-model="edu.graduationDate" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                  </div>
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderUi.descriptionBullets') }}</label>
                    <div class="bg-white/5 rounded border border-white/10 mt-1">
                      <BuilderBulletDescriptionEditor
                        :key="`edu-desc-${edu.id}`"
                        v-model="resumeData.education[index].description"
                        :rows="4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'skills'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">{{ t('builderUi.skillsTitle') }}</h1>
                <p class="text-blue-200/60 text-sm">{{ t('builderUi.skillsHelp') }}</p>
              </div>
              <button @click="addSkill" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> {{ t('builderUi.add') }}
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
              <div v-for="(skill, index) in resumeData.skills" :key="skill.id" class="flex items-center gap-2 bg-white/5 p-2 px-3 rounded-lg border border-white/10 group hover:border-white/20 transition-colors">
                <input v-model="skill.name" type="text" class="flex-1 bg-transparent border-none text-sm outline-none text-white" :placeholder="t('builderFields.skillPlaceholder')" />
                <button @click="removeSkill(index)" class="text-red-400 material-symbols-outlined text-sm hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">close</button>
              </div>
            </div>

            <!-- Skills Keyword Assistance -->
            <div class="mt-4 pt-4 border-t border-white/10 space-y-2.5 text-left pb-10">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">{{ t('builderUi.keywordsInSection') }}</span>
                <span class="text-xs text-slate-400 font-semibold">{{ t('builderUi.keywordPresent', { covered: liveKeywordMatches.filter(m => m.isCovered && m.locations.some(loc => loc.section === 'Skills')).length, total: liveKeywordMatches.length }) }}</span>
              </div>
              <div v-if="!liveKeywordMatches.length" class="text-xs text-slate-500 italic">{{ t('builderUi.noKeywordsYet') }}</div>
              <div v-else class="flex flex-wrap gap-1.5">
                <button
                  v-for="m in liveKeywordMatches"
                  :key="`sk-kw-${m.keyword}`"
                  type="button"
                  @click="!m.locations.some(loc => loc.section === 'Skills') && resumeData.skills.push({ id: newId(), name: m.keyword })"
                  class="text-xs px-2.5 py-1 rounded-lg border transition-all text-left flex items-center gap-1.5 cursor-pointer"
                  :class="m.locations.some(loc => loc.section === 'Skills') ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800/40 text-slate-400 border-white/5 hover:border-blue-400/50 hover:text-white'"
                >
                  <span class="material-symbols-outlined text-[12px] text-emerald-400" v-if="m.locations.some(loc => loc.section === 'Skills')">check_circle</span>
                  <span class="material-symbols-outlined text-[12px] text-blue-400" v-else>add</span>
                  {{ m.keyword }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'achievements'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">{{ t('builderUi.achievementsTitle') }}</h1>
                <p class="text-blue-200/60 text-sm">{{ t('builderUi.achievementsHelp') }}</p>
              </div>
              <button @click="addAchievement" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> {{ t('builderUi.add') }}
              </button>
            </div>
            <div class="space-y-6 pb-10">
              <div v-for="(ach, index) in resumeData.achievements" :key="ach.id" class="bg-white/5 p-6 rounded-xl border border-white/10 relative group hover:border-white/20 transition-colors">
                <button @click="removeAchievement(index)" class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10">delete</button>
                <div class="space-y-5 mt-2">
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.itemTitle') }}</label>
                    <input v-model="ach.title" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none transition-colors" />
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.issuerOrg') }}</label>
                      <input v-model="ach.issuer" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                    <div class="flex flex-col">
                      <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.date') }}</label>
                      <input v-model="ach.date" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none transition-colors" />
                    </div>
                  </div>
                  <div class="flex flex-col">
                    <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderUi.descriptionBullets') }}</label>
                    <div class="bg-white/5 rounded border border-white/10 mt-1">
                      <BuilderBulletDescriptionEditor
                        :key="`ach-desc-${ach.id}`"
                        v-model="resumeData.achievements[index].description"
                        :rows="4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'custom'">
            <div class="mb-8 flex justify-between items-end">
              <div>
                <h1 class="font-bold text-2xl text-white mb-1">{{ t('builderUi.customSectionsTitle') }}</h1>
                <p class="text-blue-200/60 text-sm">{{ t('builderUi.customSectionsHelp') }}</p>
              </div>
              <button @click="addCustomSection" class="text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <span class="material-symbols-outlined text-[16px] align-text-bottom mr-1">add</span> {{ t('builderUi.addSection') }}
              </button>
            </div>
            <div class="space-y-10 pb-10">
              <div v-for="(section, sIndex) in resumeData.customSections" :key="section.id" class="bg-white/5 p-6 rounded-xl border border-white/10 relative">
                <button @click="removeCustomSection(sIndex)" class="absolute top-4 right-4 text-red-400 hover:text-red-300 material-symbols-outlined text-sm bg-red-400/10 p-1.5 rounded-md transition-colors z-10">delete</button>
                <div class="flex flex-col mb-6 w-3/4">
                  <label class="text-[10px] uppercase font-semibold text-blue-400 tracking-wider mb-1">{{ t('builderFields.sectionTitle') }}</label>
                  <input v-model="section.title" type="text" class="w-full bg-transparent border-0 border-b-2 border-blue-500/50 py-1 focus:border-blue-400 text-white text-lg font-bold outline-none transition-colors" />
                </div>
                
                <div class="space-y-6">
                  <div v-for="(item, iIndex) in section.items" :key="item.id" class="bg-black/20 p-4 rounded border border-white/5 relative group hover:border-white/20 transition-colors">
                    <button @click="removeCustomItem(section, iIndex)" class="absolute top-2 right-2 text-red-400 hover:text-red-300 material-symbols-outlined text-sm transition-colors opacity-0 group-hover:opacity-100 z-10">close</button>
                    <div class="space-y-4">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="flex flex-col">
                          <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.itemTitle') }}</label>
                          <input v-model="item.title" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white font-semibold outline-none text-sm transition-colors" />
                        </div>
                        <div class="flex flex-col">
                          <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.date') }}</label>
                          <input v-model="item.date" type="month" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none text-sm transition-colors" />
                        </div>
                      </div>
                      <div class="flex flex-col">
                        <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderFields.subtitle') }}</label>
                        <input v-model="item.subtitle" type="text" class="w-full bg-transparent border-0 border-b border-white/20 py-1 focus:border-blue-400 text-white outline-none text-sm transition-colors" />
                      </div>
                      <div class="flex flex-col">
                        <label class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{{ t('builderUi.descriptionBullets') }}</label>
                        <div class="bg-white/5 rounded border border-white/10 mt-1">
                          <BuilderBulletDescriptionEditor
                            :key="`custom-desc-${item.id}`"
                            v-model="resumeData.customSections[sIndex].items[iIndex].description"
                            :rows="4"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button @click="addCustomItem(section)" class="text-xs flex items-center text-blue-300 hover:text-blue-400 transition-colors mt-4">
                  <span class="material-symbols-outlined text-[14px] mr-1">add</span> {{ t('builderUi.addItem') }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'atsCheck'" class="pb-12">
            <div class="mb-8">
              <div class="flex items-center gap-2 mb-1">
                <h1 class="font-bold text-2xl text-white">{{ t('builderAts.title') }}</h1>
                <span class="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{{ t('builderUi.pro') }}</span>
              </div>
              <p class="text-blue-200/60 text-sm">
                {{ t('builderAts.help') }}
              </p>
            </div>

            <div v-if="!canAccessAI" class="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100 text-sm">
              {{ aiBlockedMessage() || t('builderAts.upgradeHelp') }}
              <NuxtLink to="/pricing" class="ml-2 underline text-amber-200 hover:text-white">{{ t('builderUi.viewPricing') }}</NuxtLink>
            </div>

            <div class="space-y-4 mb-6">
              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  {{ t('builderAts.jobDescOptional') }}
                </label>
                <textarea
                  v-model="resumeData.targetJobDescription"
                  rows="5"
                  class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-400 resize-y"
                  :placeholder="t('builderAts.jobDescPlaceholder')"
                />
              </div>
              <div class="flex flex-col">
                <label class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  {{ t('builderAts.fixInstructions') }}
                </label>
                <textarea
                  v-model="atsFixInstructions"
                  rows="3"
                  class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-400 resize-y"
                  :placeholder="t('builderAts.fixPlaceholder')"
                />
              </div>
              <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-1.5">
                <label class="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    class="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/40"
                    :checked="resumeData.useMetrics === true"
                    @change="resumeData.useMetrics = ($event.target as HTMLInputElement).checked"
                  >
                  <span class="text-sm font-semibold text-slate-200">{{ $t('metrics.label') }}</span>
                </label>
                <p class="text-[11px] text-slate-500 pl-7">{{ $t('metrics.hint') }}</p>
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
                {{ atsRunning ? t('builderAts.analyzing') : t('builderAts.runCheck') }}
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
                {{ atsFixing ? t('builderAts.applyingFixes') : t('builderAts.fixIssues') }}
              </button>
              </div>
              <p v-if="atsResult" class="text-[11px] text-slate-400 w-full">
                Fix uses 3 credits and rewrites summary, bullets, and skills from the audit findings. Your fix instructions (if any) take priority.
              </p>
            </div>

            <div v-if="atsResult" class="space-y-6">
              <div class="rounded-xl border border-app-border bg-app-input p-6 flex flex-wrap items-center gap-6">
                <div class="flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 border-indigo-400/60 bg-indigo-500/10">
                  <span class="text-3xl font-black text-app-fg">{{ atsResult.score }}</span>
                  <span class="text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-200">/ 100</span>
                </div>
                <div class="flex-1 min-w-[200px]">
                  <p class="text-xs uppercase tracking-widest text-app-muted mb-1">{{ t('builderAts.grade') }} {{ atsResult.grade }}</p>
                  <p class="text-app-fg text-sm leading-relaxed">{{ atsResult.summary }}</p>
                </div>
              </div>

              <div v-if="atsResult.strengths.length">
                <h3 class="text-xs uppercase tracking-widest text-emerald-700 dark:text-emerald-300/80 font-semibold mb-2">{{ t('builderAts.strengths') }}</h3>
                <ul class="space-y-1.5">
                  <li
                    v-for="(s, i) in atsResult.strengths"
                    :key="`str-${i}`"
                    class="text-sm text-app-fg flex gap-2"
                  >
                    <span class="material-symbols-outlined text-emerald-500 text-[16px] mt-0.5">check_circle</span>
                    <span>{{ s }}</span>
                  </li>
                </ul>
              </div>

              <div v-if="atsResult.issues.length">
                <h3 class="text-xs uppercase tracking-widest text-app-muted font-semibold mb-2">{{ t('builderAts.issues') }}</h3>
                <div class="space-y-3">
                  <div
                    v-for="(issue, i) in atsResult.issues"
                    :key="`iss-${i}`"
                    class="rounded-lg border p-3 text-sm"
                    :class="atsSeverityClass(issue.severity)"
                  >
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[10px] uppercase font-bold tracking-wider opacity-90">{{ issue.severity }}</span>
                      <span class="text-[10px] uppercase tracking-wider opacity-70">{{ issue.category }}</span>
                    </div>
                    <p class="font-semibold mb-1 text-inherit">{{ issue.message }}</p>
                    <p class="opacity-90 text-xs leading-relaxed text-inherit">{{ issue.suggestion }}</p>
                  </div>
                </div>
              </div>

              <!-- Detailed Keyword Explainability -->
              <div v-if="atsResult.keywordsAnalysis && atsResult.keywordsAnalysis.length" class="space-y-3">
                <h3 class="text-xs uppercase tracking-widest text-app-muted font-semibold mb-1">{{ t('builderAts.keywordAlignment') }}</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    v-for="(k, i) in atsResult.keywordsAnalysis"
                    :key="`kwa-${i}`"
                    class="flex items-center justify-between p-3 rounded-lg border border-app-border bg-app-input"
                  >
                    <div class="text-left">
                      <p class="text-sm font-semibold text-app-fg">{{ k.keyword }}</p>
                      <p v-if="k.status === 'found'" class="text-[10px] text-app-muted">
                        Found in: <span class="text-indigo-600 dark:text-blue-300 capitalize font-medium">{{ k.foundInSection }}</span> ({{ k.count }}x)
                      </p>
                      <p v-else class="text-[10px] text-app-muted">{{ t('builderAts.notFound') }}</p>
                    </div>
                    <span
                      class="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                      :class="k.status === 'found' ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30'"
                    >
                      {{ k.status }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Fallback Legacy Keyword Gaps -->
              <div v-else-if="atsResult.keywordGaps.length" class="flex flex-wrap gap-2">
                <h3 class="w-full text-xs uppercase tracking-widest text-app-muted font-semibold mb-1">{{ t('builderAts.keywordGaps') }}</h3>
                <span
                  v-for="(kw, i) in atsResult.keywordGaps"
                  :key="`kw-${i}`"
                  class="text-[11px] px-2 py-1 rounded-full bg-app-input text-app-fg border border-app-border"
                >{{ kw }}</span>
              </div>

              <!-- Suggested Section Changes & Rewrites -->
              <div v-if="atsResult.sectionChanges && atsResult.sectionChanges.length" class="space-y-4">
                <h3 class="text-xs uppercase tracking-widest text-app-muted font-semibold mb-2">{{ t('builderAts.suggestedRewrites') }}</h3>
                <div class="space-y-4">
                  <div
                    v-for="(sc, i) in atsResult.sectionChanges"
                    :key="`sc-${i}`"
                    class="rounded-xl border border-app-border bg-app-panel p-4 space-y-3"
                  >
                    <div class="flex justify-between items-center border-b border-app-border pb-2">
                      <h4 class="text-xs font-bold text-indigo-700 dark:text-blue-300 uppercase tracking-wider capitalize text-left">
                        {{ sc.section }} Section
                      </h4>
                    </div>
                    <p class="text-xs text-app-muted leading-relaxed italic text-left">
                      {{ sc.relevanceReason }}
                    </p>

                    <div class="space-y-3 pt-2">
                      <div
                        v-for="(rw, rwIdx) in sc.suggestedRewrites"
                        :key="`rw-${rwIdx}`"
                        class="space-y-2 border-t border-app-border pt-3 first:border-t-0 first:pt-0 text-left"
                      >
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div class="p-2.5 bg-rose-500/10 border border-rose-500/25 rounded text-xs text-rose-950 dark:text-rose-100">
                            <span class="text-[9px] uppercase font-bold text-rose-700 dark:text-rose-400 block mb-1">{{ t('builderAts.original') }}</span>
                            <p class="italic text-rose-950 dark:text-rose-100/95">{{ rw.original }}</p>
                          </div>
                          <div class="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded text-xs text-emerald-950 dark:text-emerald-100 relative">
                            <span class="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block mb-1">{{ t('builderAts.suggested') }}</span>
                            <p class="italic pr-14 text-emerald-950 dark:text-emerald-100/95">{{ rw.suggested }}</p>
                            <button
                              type="button"
                              class="absolute top-2 right-2 px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-500 transition duration-200 cursor-pointer"
                              @click="applySuggestedRewrite(sc.section, rw.original, rw.suggested)"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                        <p class="text-[10px] text-app-muted leading-relaxed">
                          <strong class="text-app-fg">{{ t('builderAts.whyRewrite') }}</strong> {{ rw.explanation }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="atsResult.quickWins.length">
                <h3 class="text-xs uppercase tracking-widest text-indigo-700 dark:text-blue-300/80 font-semibold mb-2">{{ t('builderAts.quickWins') }}</h3>
                <ol class="list-decimal list-inside space-y-1.5 text-sm text-app-fg">
                  <li v-for="(w, i) in atsResult.quickWins" :key="`qw-${i}`">{{ w }}</li>
                </ol>
              </div>
            </div>
          </div>

          <!-- History & Version Diff tab -->
          <div v-if="activeTab === 'history'" class="pb-12 space-y-6">
            <div class="mb-6">
              <h1 class="font-bold text-2xl text-white mb-1">{{ t('builderHistory.title') }}</h1>
              <p class="text-blue-200/60 text-sm">
                View previous snapshots of your resume, compare changes, and revert if needed.
              </p>
            </div>

            <!-- Loading indicator -->
            <div v-if="loadingVersions && !versions.length" class="flex items-center gap-2 text-sm text-slate-400">
              <span class="material-symbols-outlined animate-spin text-[18px]">refresh</span>
              <span>{{ t('builderHistory.loading') }}</span>
            </div>

            <!-- Version List -->
            <div v-if="!selectedVersionId" class="space-y-3">
              <div v-if="!versions.length" class="text-slate-500 italic text-sm py-4">
                {{ t('builderHistory.empty') }}
              </div>
              <div
                v-for="v in versions"
                :key="v.id"
                class="group p-4 bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-xl transition duration-200 cursor-pointer flex items-center justify-between gap-4"
                @click="selectedVersionId = v.id"
              >
                <div class="text-left">
                  <p class="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {{ v.label }}
                  </p>
                  <p class="text-[11px] text-slate-400">
                    {{ new Date(v.createdAt).toLocaleString() }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition duration-200 cursor-pointer font-semibold"
                  >
                    {{ t('builderHistory.compareDiff') }}
                  </button>
                  <button
                    type="button"
                    class="px-2.5 py-1 bg-blue-500/20 text-blue-300 hover:bg-blue-600 hover:text-white rounded text-xs transition duration-200 cursor-pointer font-semibold"
                    @click.stop="revertToVersion(v.id)"
                  >
                    {{ t('builderHistory.restore') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Comparison Diff View -->
            <div v-else-if="selectedVersion" class="space-y-6">
              <div class="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div class="text-left">
                  <p class="text-xs text-slate-400 font-medium">Comparing with version from {{ new Date(selectedVersion.createdAt).toLocaleString() }}</p>
                  <p class="text-sm font-semibold text-white">Label: {{ selectedVersion.label }}</p>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 font-semibold text-xs transition duration-200 cursor-pointer"
                    :disabled="reverting"
                    @click="revertToVersion(selectedVersion.id)"
                  >
                    {{ t('builderHistory.restoreThis') }}
                  </button>
                  <button
                    type="button"
                    class="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded font-semibold text-xs transition duration-200 cursor-pointer"
                    @click="selectedVersionId = null"
                  >
                    {{ t('builderHistory.clearComparison') }}
                  </button>
                </div>
              </div>

              <!-- Summary Diff -->
              <div class="space-y-2">
                <h3 class="text-xs uppercase tracking-widest font-bold text-slate-400 text-left">{{ t('builderFields.professionalSummary') }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-slate-200 text-left">
                    <p class="font-semibold text-rose-400 mb-1">{{ t('builderHistory.previousVersion') }}</p>
                    <p class="whitespace-pre-wrap">{{ selectedVersion.content.personalInfo?.summary || t('builderHistory.emptyContent') }}</p>
                  </div>
                  <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-slate-200 text-left">
                    <p class="font-semibold text-emerald-400 mb-1">{{ t('builderHistory.currentVersion') }}</p>
                    <p class="whitespace-pre-wrap">{{ resumeData.personalInfo.summary || t('builderHistory.emptyContent') }}</p>
                  </div>
                </div>
              </div>

              <!-- Experience Diff -->
              <div class="space-y-2">
                <h3 class="text-xs uppercase tracking-widest font-bold text-slate-400 text-left">{{ t('builderUi.experienceTitle') }}</h3>
                <div class="space-y-4">
                  <div v-for="(exp, idx) in resumeData.experience" :key="exp.id" class="border-b border-white/5 pb-4 last:border-b-0">
                    <h4 class="text-xs font-semibold text-white mb-2 text-left">{{ exp.title }} @ {{ exp.company }}</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-slate-200 text-left">
                        <p class="font-semibold text-rose-400 mb-1">{{ t('builderHistory.previousVersion') }}</p>
                        <p class="whitespace-pre-wrap" v-html="selectedVersion.content.experience?.[idx]?.description || t('builderHistory.notPresent')"></p>
                      </div>
                      <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-slate-200 text-left">
                        <p class="font-semibold text-emerald-400 mb-1">{{ t('builderHistory.currentVersion') }}</p>
                        <p class="whitespace-pre-wrap" v-html="exp.description"></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Projects Diff -->
              <div class="space-y-2">
                <h3 class="text-xs uppercase tracking-widest font-bold text-slate-400 text-left">{{ t('builderUi.projectsTitle') }}</h3>
                <div class="space-y-4">
                  <div v-for="(proj, idx) in resumeData.projects" :key="proj.id" class="border-b border-white/5 pb-4 last:border-b-0">
                    <h4 class="text-xs font-semibold text-white mb-2 text-left">{{ proj.title }}</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-slate-200 text-left">
                        <p class="font-semibold text-rose-400 mb-1">{{ t('builderHistory.previousVersion') }}</p>
                        <p class="whitespace-pre-wrap" v-html="selectedVersion.content.projects?.[idx]?.description || t('builderHistory.notPresent')"></p>
                      </div>
                      <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-slate-200 text-left">
                        <p class="font-semibold text-emerald-400 mb-1">{{ t('builderHistory.currentVersion') }}</p>
                        <p class="whitespace-pre-wrap" v-html="proj.description"></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        <!-- Right Pane: Live PDF preview (matches selected gallery template) -->
        <section
          class="h-full bg-slate-800/80 overflow-auto p-4 sm:p-8 lg:p-12 justify-start lg:justify-center items-start shadow-inner w-full lg:w-[60%]"
          :class="mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'"
        >
          <div class="shrink-0 mx-auto w-full max-w-[240mm]">
            <BuilderPdfResumePdfPreview :resume="resumeData" />
          </div>
        </section>
      </main>

      <!-- Floating Keyword Heatmap Widget -->
      <div
        class="fixed bottom-6 right-6 z-30 transition-all duration-300 ease-in-out select-none flex flex-col items-end"
      >
        <!-- Collapsed Badge -->
        <button
          v-if="!expandedHeatmap"
          type="button"
          @click="expandedHeatmap = true"
          class="flex items-center gap-3.5 px-4 py-3 rounded-full bg-slate-900/90 border border-white/10 text-white font-semibold text-xs shadow-2xl hover:bg-slate-800 hover:border-blue-400/50 hover:shadow-blue-500/10 hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          <!-- Circular progress indicator -->
          <div class="relative w-5 h-5 flex items-center justify-center">
            <svg class="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="#10b981"
                stroke-width="2"
                :stroke-dasharray="2 * Math.PI * 8"
                :stroke-dashoffset="2 * Math.PI * 8 * (1 - (liveCoverageCount / Math.max(1, liveCoverageTotal)))"
              />
            </svg>
            <span class="text-[8px] font-black text-slate-300">{{ Math.round((liveCoverageCount / Math.max(1, liveCoverageTotal)) * 100) }}%</span>
          </div>
          <div class="text-left leading-none">
            <p class="font-bold text-white text-[11px]">{{ t('builderUi.keywordCoverage') }}</p>
            <p class="text-[9px] text-slate-400 mt-0.5">{{ t('builderUi.keywordPresent', { covered: liveCoverageCount, total: liveCoverageTotal }) }}</p>
          </div>
          <span class="material-symbols-outlined text-[16px] text-slate-400">expand_less</span>
        </button>

        <!-- Expanded Drawer Panel -->
        <div
          v-else
          class="w-80 sm:w-96 max-h-[500px] flex flex-col bg-slate-950/95 border border-white/15 shadow-2xl rounded-2xl p-4 backdrop-blur-2xl transition-all duration-300"
        >
          <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div class="text-left">
              <h3 class="font-bold text-sm text-white">{{ t('builderUi.keywordHeatmapTitle') }}</h3>
              <p class="text-[10px] text-slate-400 mt-0.5">{{ t('builderUi.keywordPresent', { covered: liveCoverageCount, total: liveCoverageTotal }) }}</p>
            </div>
            <button
              type="button"
              @click="expandedHeatmap = false; selectedHeatmapKeyword = null"
              class="text-slate-400 hover:text-white material-symbols-outlined text-sm bg-white/5 hover:bg-white/10 p-1 rounded-md transition-colors cursor-pointer"
            >
              close
            </button>
          </div>

          <!-- Heatmap Progress Bar -->
          <div class="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden mb-4 border border-white/5 flex">
            <div
              class="bg-emerald-500 h-full rounded-full transition-all duration-300"
              :style="{ width: `${(liveCoverageCount / Math.max(1, liveCoverageTotal)) * 100}%` }"
            />
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0 space-y-4">
            <!-- Keyword Clouds -->
            <div>
              <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 text-left">{{ t('builderUi.keywordHeatmapHint') }}</p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="m in liveKeywordMatches"
                  :key="`hm-${m.keyword}`"
                  type="button"
                  @click="selectedHeatmapKeyword = selectedHeatmapKeyword === m.keyword ? null : m.keyword"
                  class="text-[11px] px-2.5 py-1 rounded-lg border transition-all text-center flex items-center gap-1 cursor-pointer font-medium"
                  :class="[
                    m.isCovered ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300/85 border-rose-500/20',
                    selectedHeatmapKeyword === m.keyword ? 'ring-2 ring-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : ''
                  ]"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="m.isCovered ? 'bg-emerald-400' : 'bg-rose-400'" />
                  {{ m.keyword }}
                </button>
              </div>
            </div>

            <!-- Inspect Panel -->
            <div
              v-if="selectedHeatmapKeyword"
              class="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2 text-left text-xs transition-all duration-200"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-white text-xs">{{ t('builderUi.inspecting') }} {{ selectedHeatmapKeyword }}</span>
                <span
                  class="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                  :class="liveKeywordMatches.find(m => m.keyword === selectedHeatmapKeyword)?.isCovered ? 'bg-emerald-500/25 text-emerald-300' : 'bg-rose-500/25 text-rose-300'"
                >
                  {{ liveKeywordMatches.find(m => m.keyword === selectedHeatmapKeyword)?.isCovered ? t('builderUi.present') : t('builderUi.missing') }}
                </span>
              </div>

              <!-- Found Locations -->
              <div v-if="liveKeywordMatches.find(m => m.keyword === selectedHeatmapKeyword)?.isCovered">
                <p class="text-[10px] text-slate-400 font-semibold mb-1">{{ t('builderUi.foundInLocations') }}</p>
                <ul class="space-y-1.5">
                  <li
                    v-for="(loc, lIdx) in liveKeywordMatches.find(m => m.keyword === selectedHeatmapKeyword)?.locations"
                    :key="`loc-${lIdx}`"
                    class="bg-slate-900/60 p-2 rounded border border-white/5 space-y-1"
                  >
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-blue-300 text-[10px] uppercase tracking-wider">{{ loc.section }}</span>
                      <span v-if="loc.bulletIndex" class="text-[9px] text-slate-400">{{ t('builderUi.bulletN', { n: loc.bulletIndex }) }}</span>
                    </div>
                    <p class="text-[11px] text-slate-200 italic leading-relaxed" v-if="loc.text">
                      "{{ loc.text }}"
                    </p>
                    <p class="text-[10px] text-slate-400" v-else>
                      Mentioned in {{ loc.title }}
                    </p>
                  </li>
                </ul>
              </div>

              <!-- Missing Instructions -->
              <div v-else class="space-y-1.5">
                <p class="text-[10px] text-slate-400">Not yet covered in your resume drafts. Suggestions:</p>
                <div class="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded text-blue-200 space-y-1">
                  <p class="font-semibold text-[10px]">Guided Suggestion:</p>
                  <p class="text-[10px] leading-relaxed">
                    {{ t('builderUi.keywordSuggestion', { keyword: selectedHeatmapKeyword }) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ApplyEmailModal v-model="showApplyModal" :resume-data="resumeData" />
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
