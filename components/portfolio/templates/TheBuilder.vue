<script setup lang="ts">
import { portfolioContactCta } from '~/composables/usePortfolioContact'
import { orderedBodySections, type PortfolioProfileData } from '~/shared/types/portfolio'
import { absoluteUrl, mailtoHref } from '~/shared/types/portfolio'

const props = defineProps<{ data: PortfolioProfileData }>()

const sections = computed(() =>
  orderedBodySections(props.data, {
    projects: 'Builds & Engineered Projects',
    skills: 'Tools of the Trade',
  }),
)

const initials = computed(() => {
  const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
})

const primaryCta = computed(() => portfolioContactCta())

const specSheet = computed(() => {
  const skills = props.data.core_skills ?? []
  const projects = props.data.formatted_projects ?? []
  return [
    { key: 'name', value: props.data.full_name },
    { key: 'projects', value: String(projects.length) },
    { key: 'skills', value: skills.slice(0, 3).join(', ') || 'full-stack engineering' },
    { key: 'focus', value: skills[0] || 'precise, incremental, tested' },
  ]
})

const gridStyle = {
  backgroundImage:
    'linear-gradient(rgba(16,185,129,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)',
  backgroundSize: '40px 40px',
}
</script>

<template>
  <div
    id="top"
    class="min-h-screen bg-primary-950 text-primary-100"
    :style="gridStyle"
  >
    <!-- Sticky Nav -->
    <header class="sticky top-0 z-50 border-b border-primary-500/20 bg-primary-950/90 backdrop-blur">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#top"
          class="flex items-center gap-2 text-lg font-bold tracking-tight text-primary-100"
          style="font-family:'JetBrains Mono',monospace"
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded border border-primary-500/50 bg-primary-500/10 text-xs text-primary-400"
          >
            {{ initials }}
          </span>
          <span class="text-primary-400">&lt;</span>{{ data.full_name.split(' ')[0] }}<span class="text-primary-400">/&gt;</span>
        </a>
        <div
          class="hidden items-center gap-8 text-sm text-primary-400 sm:flex"
          style="font-family:'JetBrains Mono',monospace"
        >
          <a href="#work" class="transition-colors hover:text-primary-400">{{ data.button_texts?.nav_projects || '01_work' }}</a>
          <a href="#skills" class="transition-colors hover:text-primary-400">{{ data.button_texts?.nav_skills || '02_skills' }}</a>
          <a href="#contact" class="transition-colors hover:text-primary-400">{{ data.button_texts?.contact_cta || data.cta_text || '03_contact' }}</a>
        </div>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="rounded border border-primary-500/40 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-300 transition-colors hover:bg-primary-500/20"
          style="font-family:'JetBrains Mono',monospace"
        >
          &gt; build_with_me
        </a>
      </nav>
    </header>

    <!-- Hero -->
    <section class="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <div class="grid gap-16 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div>
          <p
            class="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"
            style="font-family:'JetBrains Mono',monospace"
          >
            <span class="material-symbols-outlined text-sm">architecture</span>
            precision engineering &amp; digital craft
          </p>
          <h1
            class="text-4xl font-bold leading-tight text-primary-50 sm:text-5xl"
            style="font-family:'Playfair Display',serif"
          >
            Engineering scalable digital products with well-crafted, precise lines.
          </h1>
          <p
            v-if="data.professional_bio"
            class="mt-6 max-w-xl text-base leading-relaxed text-primary-400"
          >
            {{ data.professional_bio }}
          </p>
          <p
            class="mt-4 text-xs uppercase tracking-[0.2em] text-primary-600"
            style="font-family:'JetBrains Mono',monospace"
          >
            // built by {{ data.full_name }}
          </p>
          <div class="mt-8 flex flex-wrap gap-4">
            <a
              href="#work"
              class="rounded border border-primary-700 bg-primary-900 px-5 py-3 text-sm font-semibold text-primary-100 transition-colors hover:border-primary-500 hover:text-primary-300"
              style="font-family:'JetBrains Mono',monospace"
            >
              inspect_the_work()
            </a>
            <a
              :href="primaryCta.href"
              :target="primaryCta.external ? '_blank' : undefined"
              :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
              class="rounded bg-primary-500 px-5 py-3 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400"
              style="font-family:'JetBrains Mono',monospace"
            >
              start_a_project()
            </a>
          </div>
        </div>

        <!-- Spec sheet panel -->
        <div class="relative rounded border border-primary-500/30 bg-primary-900/60 p-6">
          <span class="absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 border-primary-400" />
          <span class="absolute -right-px -top-px h-4 w-4 border-r-2 border-t-2 border-primary-400" />
          <span class="absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-primary-400" />
          <span class="absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 border-primary-400" />
          <p
            class="mb-4 text-xs uppercase tracking-widest text-primary-400"
            style="font-family:'JetBrains Mono',monospace"
          >
            spec_sheet.txt
          </p>
          <dl class="space-y-3 text-xs" style="font-family:'JetBrains Mono',monospace">
            <div
              v-for="row in specSheet"
              :key="row.key"
              class="flex items-baseline justify-between gap-4 border-b border-primary-800 pb-3"
            >
              <dt class="shrink-0 text-primary-500">{{ row.key }}:</dt>
              <dd class="truncate text-right text-primary-200">{{ row.value }}</dd>
            </div>
          </dl>
          <p class="mt-4 text-xs text-primary-500/70" style="font-family:'JetBrains Mono',monospace">
            status: <span class="text-primary-400">available_for_work</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Ordered body sections (projects / skills / custom) -->
    <template v-for="section in sections" :key="section.key">
      
      <!-- Experience -->
      <PortfolioExperienceSection
        v-if="section.kind === 'experience'"
        :title="section.title"
        :items="data.formatted_experience || []"
        tone="dark"
      />
      <section
        v-else-if="section.kind === 'projects'"
        id="work"
        class="border-t border-primary-500/20 bg-primary-950 px-6 py-24"
      >
        <div class="mx-auto max-w-6xl">
          <p
            class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"
            style="font-family:'JetBrains Mono',monospace"
          >
            section_01
          </p>
          <h2 class="text-3xl font-bold text-primary-50" style="font-family:'Playfair Display',serif">
            {{ section.title }}
          </h2>

          <div
            v-if="data.formatted_projects?.length"
            class="mt-12 grid gap-6 sm:grid-cols-2"
          >
            <PortfolioProjectLink
              v-for="(project, idx) in data.formatted_projects"
              :key="project.title + idx"
              :project="project"
              :index="idx"
              v-slot="{ hasLink }"
            >
              <div
                class="relative h-full rounded border border-primary-800 bg-primary-900 p-6 transition-colors group-hover:border-primary-500/50"
              >
                <span class="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-primary-500/60" />
                <span class="absolute -right-px -bottom-px h-3 w-3 border-b-2 border-r-2 border-primary-500/60" />
                <div
                  class="mb-3 flex items-center justify-between text-xs text-primary-500"
                  style="font-family:'JetBrains Mono',monospace"
                >
                  <span class="text-primary-400">{{ String(idx + 1).padStart(2, '0') }} /</span>
                  <span v-if="hasLink" class="inline-flex items-center gap-1 text-primary-400">
                    <span class="material-symbols-outlined text-sm">open_in_new</span>
                  </span>
                  <span v-else>build</span>
                </div>
                <h3 class="text-lg font-semibold text-primary-100">{{ project.title }}</h3>
                <PortfolioRichText v-if="project.description" class="mt-2 text-sm leading-relaxed text-primary-400" :content="project.description" />
                <div v-if="project.tech_stack?.length" class="mt-4 flex flex-wrap gap-2">
                  <code
                    v-for="tech in project.tech_stack"
                    :key="tech"
                    class="rounded border border-primary-500/30 bg-primary-500/10 px-2 py-1 text-xs text-primary-300"
                    style="font-family:'JetBrains Mono',monospace"
                  >
                    {{ tech }}
                  </code>
                </div>
                <p
                  v-if="hasLink"
                  class="mt-4 text-xs font-semibold text-primary-400"
                  style="font-family:'JetBrains Mono',monospace"
                >
                  open_project() →
                </p>
              </div>
            </PortfolioProjectLink>
          </div>
        </div>
      </section>

      <section
        v-else-if="section.kind === 'skills'"
        id="skills"
        class="border-t border-primary-500/20 bg-primary-900/30 px-6 py-24"
      >
        <div class="mx-auto max-w-6xl">
          <p
            class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"
            style="font-family:'JetBrains Mono',monospace"
          >
            section_02
          </p>
          <h2 class="text-3xl font-bold text-primary-50" style="font-family:'Playfair Display',serif">
            {{ section.title }}
          </h2>

          <div
            v-if="data.core_skills?.length"
            class="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div
              v-for="skill in data.core_skills"
              :key="skill"
              class="flex items-center gap-3 rounded border border-primary-800 bg-primary-950 px-4 py-3 text-sm text-primary-300"
              style="font-family:'JetBrains Mono',monospace"
            >
              <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
              {{ skill }}
            </div>
          </div>
        </div>
      </section>

      <section
        v-else-if="section.custom && section.custom.content?.trim()"
        :id="`section-${section.key}`"
        class="border-t border-primary-500/20 bg-primary-950 px-6 py-24"
      >
        <div class="mx-auto max-w-6xl">
          <p
            class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"
            style="font-family:'JetBrains Mono',monospace"
          >
            custom_section
          </p>
          <h2 class="text-3xl font-bold text-primary-50" style="font-family:'Playfair Display',serif">
            {{ section.title }}
          </h2>
          <div class="mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-primary-400">
            <p
              v-for="(paragraph, pIdx) in section.custom.content.split(/\n{2,}/)"
              :key="pIdx"
            >
              {{ paragraph.trim() }}
            </p>
          </div>
        </div>
      </section>
    </template>

    <!-- Contact / Footer -->
    <footer id="contact" class="border-t border-primary-500/20 bg-primary-950 px-6 py-24">
      <div class="mx-auto max-w-3xl text-center">
        <p
          class="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"
          style="font-family:'JetBrains Mono',monospace"
        >
          section_03 -- contact
        </p>
        <h2
          class="text-3xl font-bold text-primary-50 sm:text-4xl"
          style="font-family:'Playfair Display',serif"
        >
          Let's build.
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-sm text-primary-400">
          Open to freelance engagements where precision, craft, and clean execution matter.
        </p>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="mt-8 inline-flex items-center gap-2 rounded bg-primary-500 px-6 py-3 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400"
          style="font-family:'JetBrains Mono',monospace"
        >
          <span class="material-symbols-outlined text-base">terminal</span>
          run_contact.sh
        </a>

        <PortfolioContactLinks
          :data="data"
          variant="row"
          class-name="mt-10 justify-center text-primary-400 [&_a]:text-primary-300"
        />

        <div
          class="mt-16 flex items-center justify-center gap-3 text-xs text-primary-600"
          style="font-family:'JetBrains Mono',monospace"
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded border border-primary-500/40 text-primary-400"
          >
            {{ initials }}
          </span>
          <span>{{ data.full_name }} &mdash; precision engineering</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped></style>
