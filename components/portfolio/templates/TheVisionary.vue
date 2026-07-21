<script setup lang="ts">
import { portfolioContactCta } from '~/composables/usePortfolioContact'
import { absoluteUrl, mailtoHref, orderedBodySections, type PortfolioProfileData } from '~/shared/types/portfolio'

const props = defineProps<{ data: PortfolioProfileData }>()

const sections = computed(() =>
  orderedBodySections(props.data, { projects: 'Selected Work', skills: 'Capabilities' }),
)

const initials = computed(() => {
  const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
})

const bioSentences = computed(() => {
  const bio = props.data.professional_bio?.trim() ?? ''
  if (!bio) return { headline: '', rest: '' }
  const match = bio.match(/^(.*?[.!?])(\s+(.*))?$/s)
  if (!match) return { headline: bio, rest: '' }
  return { headline: match[1] ?? bio, rest: (match[3] ?? '').trim() }
})

const primaryCta = computed(() => portfolioContactCta())

const mockCards = computed(() => {
  const projects = props.data.formatted_projects ?? []
  const skills = props.data.core_skills ?? []
  return [0, 1, 2].map((i) => {
    const project = projects[i]
    if (project) {
      return {
        title: project.title,
        subtitle: project.tech_stack?.slice(0, 3).join(' · ') || skills[i] || '',
      }
    }
    return {
      title: skills[i] || props.data.full_name,
      subtitle: skills[i + 1] || skills[0] || '',
    }
  })
})

const gradientClasses = [
  'from-primary-500 via-purple-500 to-primary-500',
  'from-primary-400 via-primary-500 to-primary-600',
  'from-primary-500 via-primary-500 to-primary-400',
  'from-primary-400 via-orange-500 to-primary-500',
  'from-primary-400 via-primary-500 to-primary-500',
]

function gradientFor(index: number) {
  return gradientClasses[index % gradientClasses.length]
}
</script>

<template>
  <div id="top" class="min-h-screen bg-primary-50 text-primary-900" style="font-family: ui-sans-serif, system-ui, sans-serif;">
    <!-- Sticky Nav -->
    <header class="sticky top-0 z-50 border-b border-primary-200/80 bg-white/80 backdrop-blur-md">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#top"
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-primary-900"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-bold text-white shadow-md shadow-indigo-500/30"
          >
            {{ initials }}
          </span>
          <span class="hidden sm:inline">{{ data.full_name }}</span>
        </a>

        <div class="flex items-center gap-6">
          <a href="#work" class="hidden text-sm font-medium text-primary-600 transition hover:text-primary-600 sm:inline">
            {{ data.button_texts?.nav_projects || `<a href="#work" class="hidden text-sm font-medium text-primary-600 transition hover:text-primary-600 sm:inline">
            Work
          </a>`.replace(/<[^>]+>/g, '').trim() }}
          </a>
          <a href="#skills" class="hidden text-sm font-medium text-primary-600 transition hover:text-primary-600 sm:inline">
            {{ data.button_texts?.nav_skills || `<a href="#skills" class="hidden text-sm font-medium text-primary-600 transition hover:text-primary-600 sm:inline">
            Skills
          </a>`.replace(/<[^>]+>/g, '').trim() }}
          </a>
          <a href="#contact" class="hidden text-sm font-medium text-primary-600 transition hover:text-primary-600 sm:inline">
            {{ data.button_texts?.contact_cta || data.cta_text || 'Contact' }}
          </a>
          <a
            :href="primaryCta.href"
            :target="primaryCta.external ? '_blank' : undefined"
            :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
            class="rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:bg-primary-600 hover:shadow-lg hover:shadow-indigo-500/40"
          >
            Get in touch
          </a>
        </div>
      </nav>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden px-6 pb-28 pt-16 sm:pt-24">
      <!-- Ambient background blobs -->
      <div class="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-primary-200/50 blur-3xl"></div>
      <div class="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-primary-200/50 blur-3xl"></div>

      <div class="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p class="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-700">
            <span class="material-symbols-outlined text-sm">auto_awesome</span>
            {{ data.full_name }}
          </p>

          <h1
            v-if="bioSentences.headline"
            class="text-4xl font-extrabold leading-[1.1] tracking-tight text-primary-900 sm:text-5xl lg:text-6xl"
          >
            {{ bioSentences.headline }}
          </h1>
          <h1 v-else class="text-4xl font-extrabold leading-[1.1] tracking-tight text-primary-900 sm:text-5xl lg:text-6xl">
            {{ data.full_name }}
          </h1>

          <p v-if="bioSentences.rest" class="mt-6 max-w-xl text-lg leading-relaxed text-primary-600">
            {{ bioSentences.rest }}
          </p>

          <div class="mt-10 flex flex-wrap items-center gap-4">
            <a
              :href="primaryCta.href"
              :target="primaryCta.external ? '_blank' : undefined"
              :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
              class="inline-flex items-center gap-2 rounded-full bg-primary-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              Let's talk
              <span class="material-symbols-outlined text-lg">arrow_forward</span>
            </a>
            <a
              href="#work"
              class="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-primary-700 transition hover:text-primary-600"
            >
              {{ data.button_texts?.hero_cta || `View work
              south` }}
              <span class="material-symbols-outlined text-lg">south</span>
            </a>
          </div>
        </div>

        <!-- Floating UI cards populated from real project / skill data -->
        <div class="relative mx-auto hidden h-[420px] w-full max-w-md lg:block">
          <!-- Browser mockup 1 -->
          <div
            class="absolute left-0 top-4 w-80 -rotate-3 rounded-2xl border border-primary-200 bg-white p-3 shadow-2xl shadow-indigo-900/10 transition hover:-translate-y-1 hover:rotate-0"
          >
            <div class="mb-3 flex items-center gap-1.5 px-1">
              <span class="h-2.5 w-2.5 rounded-full bg-primary-400"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-primary-400"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-primary-400"></span>
            </div>
            <div class="h-28 rounded-xl bg-gradient-to-br from-primary-400 via-purple-400 to-primary-400"></div>
            <div class="mt-3 space-y-1 px-1">
              <p class="truncate text-sm font-semibold text-primary-800">{{ mockCards[0]!.title }}</p>
              <p
                v-if="mockCards[0]!.subtitle"
                class="truncate text-xs text-primary-500"
                style="font-family: 'JetBrains Mono', monospace;"
              >
                {{ mockCards[0]!.subtitle }}
              </p>
            </div>
          </div>

          <!-- Phone mockup -->
          <div
            class="absolute -bottom-2 right-2 w-40 rotate-6 rounded-3xl border-4 border-primary-900 bg-white p-2 shadow-2xl shadow-indigo-900/20 transition hover:-translate-y-1 hover:rotate-3"
          >
            <div class="mx-auto mb-2 h-1.5 w-10 rounded-full bg-primary-800"></div>
            <div class="h-44 rounded-2xl bg-gradient-to-b from-primary-300 via-primary-400 to-primary-500"></div>
            <div class="mt-2 space-y-1 px-1">
              <p class="truncate text-[11px] font-semibold text-primary-800">{{ mockCards[1]!.title }}</p>
              <p
                v-if="mockCards[1]!.subtitle"
                class="truncate text-[10px] text-primary-500"
                style="font-family: 'JetBrains Mono', monospace;"
              >
                {{ mockCards[1]!.subtitle }}
              </p>
            </div>
          </div>

          <!-- Card mockup 3 -->
          <div
            class="absolute right-8 top-32 w-56 rotate-3 rounded-2xl border border-primary-200 bg-white p-3 shadow-xl shadow-indigo-900/10 transition hover:-translate-y-1 hover:rotate-0"
          >
            <div class="flex items-center gap-2">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                <span class="material-symbols-outlined text-base text-primary-600">bolt</span>
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-semibold text-primary-800">{{ mockCards[2]!.title }}</p>
                <p
                  v-if="mockCards[2]!.subtitle"
                  class="truncate text-[10px] text-primary-500"
                  style="font-family: 'JetBrains Mono', monospace;"
                >
                  {{ mockCards[2]!.subtitle }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <template v-for="section in sections" :key="section.key">
      <!-- Experience -->
      <PortfolioExperienceSection
        v-if="section.kind === 'experience'"
        :title="section.title"
        :items="data.formatted_experience || []"
        tone="light"
      />
      <section
        v-else-if="section.kind === 'projects'"
        id="work"
        class="mx-auto max-w-6xl px-6 py-24"
      >
        <div class="mb-14 max-w-2xl">
          <p class="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-600">Selected Work</p>
          <h2 class="text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl">
            Projects worth talking about
          </h2>
        </div>

        <div class="grid gap-8 sm:grid-cols-2">
          <PortfolioProjectLink
            v-for="(project, index) in data.formatted_projects"
            :key="project.title + index"
            :project="project"
            :index="index"
            v-slot="{ hasLink }"
          >
            <div
              class="flex h-full flex-col overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm shadow-slate-200/50 transition group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-indigo-200/40"
            >
              <div
                class="relative h-40 w-full overflow-hidden bg-gradient-to-br"
                :class="gradientFor(index)"
              >
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]"></div>
                <span
                  class="material-symbols-outlined absolute bottom-3 right-3 text-4xl text-white/70 transition group-hover:scale-110"
                >
                  rocket_launch
                </span>
              </div>

              <div class="flex flex-1 flex-col p-6">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-xl font-bold text-primary-900">{{ project.title }}</h3>
                  <span
                    v-if="hasLink"
                    class="material-symbols-outlined shrink-0 text-primary-500"
                    aria-hidden="true"
                  >
                    open_in_new
                  </span>
                </div>
                <PortfolioRichText class="mt-2.5 flex-1 text-sm leading-relaxed text-primary-600" :content="project.description" />

                <div v-if="project.tech_stack && project.tech_stack.length > 0" class="mt-5 flex flex-wrap gap-2">
                  <span
                    v-for="tech in project.tech_stack"
                    :key="tech"
                    class="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700"
                    style="font-family: 'JetBrains Mono', monospace;"
                  >
                    {{ tech }}
                  </span>
                </div>
                <p
                  v-if="hasLink"
                  class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
                >
                  Open project
                  <span class="material-symbols-outlined text-base">arrow_forward</span>
                </p>
              </div>
            </div>
          </PortfolioProjectLink>
        </div>
      </section>

      <!-- Skills -->
      <section
        v-else-if="section.kind === 'skills'"
        id="skills"
        class="bg-white px-6 py-24"
      >
        <div class="mx-auto max-w-6xl">
          <div class="mb-12 max-w-2xl">
            <p class="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-600">Capabilities</p>
            <h2 class="text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl">
              Tools of the trade
            </h2>
          </div>

          <div class="flex flex-wrap gap-3">
            <span
              v-for="skill in data.core_skills"
              :key="skill"
              class="inline-flex items-center gap-2 rounded-2xl border border-primary-200 bg-primary-50 px-5 py-2.5 text-sm font-semibold text-primary-800 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
            >
              <span class="h-2 w-2 rounded-full bg-primary-500"></span>
              {{ skill }}
            </span>
          </div>
        </div>
      </section>

      <!-- Custom section -->
      <section
        v-else-if="section.custom && section.custom.content && section.custom.content.trim()"
        :id="`section-${section.key}`"
        class="mx-auto max-w-6xl px-6 py-24"
      >
        <div class="mb-14 max-w-2xl">
          <p class="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-600">{{ section.title }}</p>
          <h2 class="text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl">
            {{ section.title }}
          </h2>
        </div>

        <div class="max-w-3xl space-y-5">
          <p
            v-for="(paragraph, index) in section.custom.content.split(/\n{2,}/)"
            :key="index"
            class="text-lg leading-relaxed text-primary-600"
          >
            {{ paragraph }}
          </p>
        </div>
      </section>
    </template>

    <!-- Contact / Footer CTA -->
    <footer id="contact" class="relative overflow-hidden px-6 py-24">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600"></div>
      <div class="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
      <div class="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>

      <div class="relative mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        <h2 class="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Ready to build something impactful?
        </h2>
        <p class="max-w-xl text-lg text-primary-100">
          {{ data.full_name }} is open to new projects, collaborations, and opportunities.
        </p>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-primary-600 shadow-xl transition hover:-translate-y-0.5 hover:bg-primary-50"
        >
          <span class="material-symbols-outlined text-lg">mail</span>
          Get in touch with {{ data.full_name }}
        </a>
        <PortfolioContactLinks
          :data="data"
          variant="pills"
          class-name="text-primary-100 [&_a]:border-white/30 [&_a]:bg-white/10 [&_a]:text-white"
        />
        <a href="#top" class="text-sm font-semibold text-primary-100 underline-offset-4 transition hover:text-white hover:underline">
          Back to top
        </a>
      </div>
    </footer>
  </div>
</template>
