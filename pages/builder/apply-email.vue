<script setup lang="ts">
import ApplyEmailForm from '~/components/apply/ApplyEmailForm.vue'
import ApplyEmailSavedPanel from '~/components/apply/ApplyEmailSavedPanel.vue'
import type { BuilderResumeData } from '~/shared/types/builder'
import type { ApplyEmailTemplate } from '~/utils/applyEmailTemplates'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

type BuilderDocCard = {
  id: string
  type: string
  name: string
  updatedAt: string
}

const route = useRoute()
const toast = useAppToast()
const { t } = useI18n()

const activeTab = ref<'compose' | 'saved'>('compose')
const resumeData = ref<BuilderResumeData | null>(null)
const loadingResume = ref(false)
const selectedResumeId = ref('')

const formRef = ref<InstanceType<typeof ApplyEmailForm> | null>(null)
const savedPanelRef = ref<InstanceType<typeof ApplyEmailSavedPanel> | null>(null)

const applyTabs = computed(() => [
  { id: 'compose' as const, label: t('applyEmail.compose'), icon: 'edit_note' },
  { id: 'saved' as const, label: t('applyEmail.savedEmails'), icon: 'bookmark' },
])

const { data: documents, pending: documentsPending } = useFetch<BuilderDocCard[]>('/api/builder/documents')

const resumeOptions = computed(() =>
  (documents.value || []).filter((doc) => doc.type === 'resume'),
)

const emptyResumeData = (): BuilderResumeData => ({
  name: 'Apply via Email',
  templateId: 'modern',
  useMetrics: false,
  personalInfo: {
    fullName: '',
    location: '',
    email: '',
    phone: '',
    summary: '',
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  achievements: [],
  customSections: [],
})

async function loadResume(id: string) {
  loadingResume.value = true
  try {
    if (id) {
      resumeData.value = await $fetch<BuilderResumeData>(`/api/builder/resume/${id}`)
      selectedResumeId.value = id
    } else {
      resumeData.value = emptyResumeData()
      selectedResumeId.value = ''
    }
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    toast.error(e.data?.statusMessage || e.statusMessage || t('applyEmail.loadFailed'))
    resumeData.value = emptyResumeData()
  } finally {
    loadingResume.value = false
  }
}

function onResumeSelect(id: string) {
  void loadResume(id)
}

function selectTab(id: 'compose' | 'saved') {
  activeTab.value = id
  if (id === 'saved') savedPanelRef.value?.reload()
}

function useSavedEmail(tpl: ApplyEmailTemplate) {
  activeTab.value = 'compose'
  nextTick(() => formRef.value?.applyTemplate(tpl))
}

function editSavedEmail(tpl: ApplyEmailTemplate) {
  useSavedEmail(tpl)
}

function onEmailSaved() {
  savedPanelRef.value?.reload()
}

watch(
  [resumeOptions, documentsPending],
  ([options, pending]) => {
    if (pending) return
    if (resumeData.value && selectedResumeId.value) return

    const queryId = typeof route.query.resume === 'string' ? route.query.resume : ''
    if (queryId && options.some((doc) => doc.id === queryId)) {
      void loadResume(queryId)
    } else if (options.length) {
      void loadResume(options[0].id)
    } else {
      resumeData.value = emptyResumeData()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex min-h-[calc(100vh-4rem)]">
    <!-- Sidebar tabs -->
    <aside class="hidden lg:flex w-64 shrink-0 flex-col py-6 bg-slate-900/50 backdrop-blur-xl border-r border-white/10">
      <div class="px-6 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <span class="material-symbols-outlined">mail</span>
          </div>
          <div>
            <p class="font-semibold text-app-fg text-sm">{{ t('applyEmail.title') }}</p>
            <p class="text-[10px] text-slate-500 uppercase tracking-wider">{{ t('applyEmail.subtitle') }}</p>
          </div>
        </div>
      </div>
      <nav class="flex-1">
        <ul class="space-y-1">
          <li v-for="tab in applyTabs" :key="tab.id">
            <button
              type="button"
              class="w-full flex items-center gap-4 px-6 py-3 text-sm transition-all cursor-pointer"
              :class="activeTab === tab.id ? 'text-emerald-400 font-bold border-r-2 border-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'"
              @click="selectTab(tab.id)"
            >
              <span class="material-symbols-outlined">{{ tab.icon }}</span>
              <span>{{ tab.label }}</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- Main -->
    <div class="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
      <!-- Mobile tabs -->
      <div class="lg:hidden flex gap-1 mb-6 p-1 rounded-xl bg-slate-900/60 border border-white/10">
        <button
          v-for="tab in applyTabs"
          :key="`m-${tab.id}`"
          type="button"
          class="flex-1 py-2.5 text-xs font-bold rounded-lg cursor-pointer transition-colors"
          :class="activeTab === tab.id ? 'bg-emerald-600 text-white' : 'text-slate-400'"
          @click="selectTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="max-w-3xl">
        <div v-if="activeTab === 'compose'" class="space-y-6">
          <div>
            <h1 class="text-2xl font-bold text-app-fg mb-1">{{ t('applyEmail.composeHeading') }}</h1>
            <p class="text-sm text-slate-400">
              {{ t('applyEmail.composeHelp') }}
            </p>
          </div>

          <div v-if="documentsPending || loadingResume" class="rounded-xl border border-white/10 bg-slate-900/40 p-8 text-center text-slate-400 text-sm">
            {{ t('applyEmail.loading') }}
          </div>

          <template v-else-if="resumeData">
            <div class="rounded-xl border border-white/10 bg-slate-900/40 p-4 space-y-2">
              <label class="block text-[10px] uppercase tracking-wider font-bold text-slate-500">
                {{ t('applyEmail.resumeForContext') }}
              </label>
              <select
                v-if="resumeOptions.length"
                :value="selectedResumeId"
                class="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none cursor-pointer"
                @change="onResumeSelect(($event.target as HTMLSelectElement).value)"
              >
                <option v-for="doc in resumeOptions" :key="doc.id" :value="doc.id" class="bg-slate-900">
                  {{ doc.name }}
                </option>
              </select>
              <p v-else class="text-xs text-slate-400">
                {{ t('applyEmail.noResumeYet') }}
                <NuxtLink to="/builder" class="text-blue-400 hover:underline">{{ t('applyEmail.createOne') }}</NuxtLink>
                {{ t('applyEmail.orUploadBelow') }}
              </p>
            </div>

            <div class="rounded-xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
              <ApplyEmailForm
                ref="formRef"
                variant="page"
                :resume-data="resumeData"
                @saved="onEmailSaved"
              />
            </div>
          </template>
        </div>

        <div v-else class="space-y-6">
          <div>
            <h1 class="text-2xl font-bold text-app-fg mb-1">{{ t('applyEmail.savedHeading') }}</h1>
            <p class="text-sm text-slate-400">
              {{ t('applyEmail.savedHelp') }}
            </p>
          </div>

          <div class="rounded-xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
            <ApplyEmailSavedPanel
              ref="savedPanelRef"
              @use="useSavedEmail"
              @edit="editSavedEmail"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
