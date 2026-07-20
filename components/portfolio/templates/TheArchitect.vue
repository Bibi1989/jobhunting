<script setup lang="ts">
import { portfolioContactCta } from '~/composables/usePortfolioContact'
import { absoluteUrl, mailtoHref, orderedBodySections, type PortfolioProfileData } from '~/shared/types/portfolio'

const props = defineProps<{ data: PortfolioProfileData }>()

const sections = computed(() =>
  orderedBodySections(props.data, {
    projects: 'Selected Systems & Builds',
    skills: 'Core Competencies',
  }),
)

const initials = computed(() => {
  const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
})

const mark = initials

const primaryCta = computed(() => portfolioContactCta())

/** Prefer real skills for the diagram nodes; fall back to architecture motifs. */
const nodes = computed(() => {
  const skills = (props.data.core_skills ?? []).slice(0, 4)
  if (skills.length >= 4) return skills
  const fallback = ['API', 'Queue', 'Cache', 'DB']
  return [...skills, ...fallback].slice(0, 4)
})
</script>

<template>
  <div id="top" class="min-h-screen bg-primary-950 text-primary-100">
    <!-- Sticky Nav -->
    <header class="sticky top-0 z-50 border-b border-primary-800 bg-primary-950/90 backdrop-blur">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#top"
          class="text-lg font-bold tracking-tight text-primary-100"
          style="font-family:'JetBrains Mono',monospace"
        >
          <span class="text-primary-400">[</span>{{ mark }}<span class="text-primary-400">]</span>
        </a>
        <div
          class="hidden items-center gap-8 text-sm text-primary-400 sm:flex"
          style="font-family:'JetBrains Mono',monospace"
        >
          <a href="#work" class="transition-colors hover:text-primary-400">{{ data.button_texts?.nav_projects || './work' }}</a>
          <a href="#skills" class="transition-colors hover:text-primary-400">{{ data.button_texts?.nav_skills || './skills' }}</a>
          <a href="#contact" class="transition-colors hover:text-primary-400">{{ data.button_texts?.contact_cta || data.cta_text || './contact' }}</a>
        </div>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="rounded border border-primary-500/40 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-300 transition-colors hover:bg-primary-500/20"
          style="font-family:'JetBrains Mono',monospace"
        >
          &gt; connect()
        </a>
      </nav>
    </header>

    <!-- Hero -->
    <section class="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <div class="grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <p
            class="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"
            style="font-family:'JetBrains Mono',monospace"
          >
            // systems &amp; distributed architecture
          </p>
          <h1
            class="text-4xl font-bold leading-tight text-primary-50 sm:text-5xl"
            style="font-family:'Playfair Display',serif"
          >
            {{ data.full_name }}
          </h1>
          <p
            v-if="data.professional_bio"
            class="mt-6 max-w-xl text-base leading-relaxed text-primary-400"
          >
            {{ data.professional_bio }}
          </p>
          <div class="mt-8 flex flex-wrap gap-4">
            <a
              href="#work"
              class="rounded border border-primary-700 bg-primary-900 px-5 py-3 text-sm font-semibold text-primary-100 transition-colors hover:border-primary-500 hover:text-primary-300"
              style="font-family:'JetBrains Mono',monospace"
            >
              view_projects()
            </a>
            <a
              :href="primaryCta.href"
              :target="primaryCta.external ? '_blank' : undefined"
              :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
              class="rounded bg-primary-500 px-5 py-3 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400"
              style="font-family:'JetBrains Mono',monospace"
            >
              get_in_touch()
            </a>
          </div>
        </div>

        <!-- System diagram -->
        <div class="rounded-lg border border-primary-800 bg-primary-900/60 p-6">
          <p
            class="mb-4 text-xs uppercase tracking-widest text-primary-500"
            style="font-family:'JetBrains Mono',monospace"
          >
            system.diagram
          </p>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="node in nodes"
              :key="node"
              class="flex items-center justify-center gap-2 rounded border border-primary-500/30 bg-primary-950 px-4 py-6 text-sm text-primary-300"
              style="font-family:'JetBrains Mono',monospace"
            >
              <span class="material-symbols-outlined shrink-0 text-base text-primary-500">memory</span>
              <span class="truncate">{{ node }}</span>
            </div>
          </div>
          <div class="my-3 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary-600">south</span>
          </div>
          <pre
            class="overflow-x-auto rounded border border-primary-800 bg-primary-950 p-4 text-xs leading-relaxed text-primary-400"
            style="font-family:'JetBrains Mono',monospace"
          ><code><span class="text-primary-400">$</span> stack --describe
projects  : {{ data.formatted_projects?.length ?? 0 }}
skills    : {{ data.core_skills?.length ?? 0 }}
runtime   : node@22 / edge
status    : <span class="text-primary-400">operational</span></code></pre>
        </div>
      </div>
    </section>

    <template v-for="section in sections" :key="section.key">
      <!-- Work -->
      <section v-if="section.kind === 'projects'" id="work" class="border-t border-primary-800 bg-primary-950 px-6 py-24">
        <div class="mx-auto max-w-6xl">
          <p
            class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"
            style="font-family:'JetBrains Mono',monospace"
          >
            // 02
          </p>
          <h2 class="text-3xl font-bold text-primary-50" style="font-family:'Playfair Display',serif">
            Selected Systems &amp; Builds
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
                class="h-full rounded-lg border border-primary-800 bg-primary-900 p-6 transition-colors group-hover:border-primary-500/50"
              >
                <div
                  class="mb-3 flex items-center justify-between text-xs text-primary-500"
                  style="font-family:'JetBrains Mono',monospace"
                >
                  <span>proj_{{ String(idx + 1).padStart(2, '0') }}</span>
                  <span v-if="hasLink" class="inline-flex items-center gap-1 text-primary-400">
                    <span class="material-symbols-outlined text-sm">open_in_new</span>
                  </span>
                  <span v-else class="text-primary-500">// deployed</span>
                </div>
                <h3 class="text-lg font-semibold text-primary-100">{{ project.title }}</h3>
                <p v-if="project.description" class="mt-2 text-sm leading-relaxed text-primary-400">
                  {{ project.description }}
                </p>
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

      <!-- Skills -->
      <section v-else-if="section.kind === 'skills'" id="skills" class="border-t border-primary-800 bg-primary-900/30 px-6 py-24">
        <div class="mx-auto max-w-6xl">
          <p
            class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"
            style="font-family:'JetBrains Mono',monospace"
          >
            // 03
          </p>
          <h2 class="text-3xl font-bold text-primary-50" style="font-family:'Playfair Display',serif">
            Core Competencies
          </h2>

          <div v-if="data.core_skills?.length" class="mt-10 flex flex-wrap gap-3">
            <span
              v-for="skill in data.core_skills"
              :key="skill"
              class="flex items-center gap-2 rounded border border-primary-700 bg-primary-950 px-4 py-2 text-sm text-primary-300"
              style="font-family:'JetBrains Mono',monospace"
            >
              <span class="material-symbols-outlined text-sm text-primary-500">check_small</span>
              {{ skill }}
            </span>
          </div>
        </div>
      </section>

      <!-- Custom -->
      <section
        v-else
        :id="`section-${section.key}`"
        class="border-t border-primary-800 bg-primary-950 px-6 py-24"
      >
        <div class="mx-auto max-w-6xl">
          <p
            class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"
            style="font-family:'JetBrains Mono',monospace"
          >
            // custom
          </p>
          <h2 class="text-3xl font-bold text-primary-50" style="font-family:'Playfair Display',serif">
            {{ section.title }}
          </h2>

          <div
            v-if="section.custom?.content?.trim()"
            class="mt-8 max-w-3xl space-y-4"
          >
            <p
              v-for="(paragraph, pIdx) in section.custom.content.split(/\n{2,}/)"
              :key="pIdx"
              class="text-base leading-relaxed text-primary-400"
            >
              {{ paragraph }}
            </p>
          </div>
        </div>
      </section>
    </template>

    <!-- Contact / Footer -->
    <footer id="contact" class="border-t border-primary-800 bg-primary-950 px-6 py-24">
      <div class="mx-auto max-w-3xl text-center">
        <p
          class="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-400"
          style="font-family:'JetBrains Mono',monospace"
        >
          // 04 -- deploy_contact
        </p>
        <h2
          class="text-3xl font-bold text-primary-50 sm:text-4xl"
          style="font-family:'Playfair Display',serif"
        >
          Let's architect something reliable.
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-sm text-primary-400">
          Open to systems design, infrastructure, and distributed-platform engagements.
        </p>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="mt-8 inline-flex items-center gap-2 rounded bg-primary-500 px-6 py-3 text-sm font-semibold text-primary-950 transition-colors hover:bg-primary-400"
          style="font-family:'JetBrains Mono',monospace"
        >
          <span class="material-symbols-outlined text-base">terminal</span>
          initiate_contact()
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
          <span class="flex h-8 w-8 items-center justify-center rounded-full border border-primary-700 text-primary-400">
            {{ initials }}
          </span>
          <span>{{ data.full_name }} &mdash; systems architecture</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped></style>
