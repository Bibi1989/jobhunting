<script setup lang="ts">
import { portfolioContactCta } from '~/composables/usePortfolioContact'
import { absoluteUrl, mailtoHref, orderedBodySections, type PortfolioProfileData } from '~/shared/types/portfolio'

const props = defineProps<{ data: PortfolioProfileData }>()

const sections = computed(() =>
  orderedBodySections(props.data, { projects: 'Leadership Highlights', skills: 'Core Competencies' }),
)

/** Two-letter monogram derived from the full name, e.g. "Jordan Avery" -> "JA". */
const initials = computed(() => {
  const parts = (props.data.full_name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
})

/** Executive tagline drawn from the first clause of the bio. */
const tagline = computed(() => {
  const bio = props.data.professional_bio?.trim() ?? ''
  if (!bio) return ''
  const firstClause = bio.split(/(?<=[.!?])\s/)[0] ?? bio
  return firstClause.replace(/[.,;:]+$/, '')
})

const primaryCta = computed(() => portfolioContactCta())

function pad(index: number): string {
  return String(index + 1).padStart(2, '0')
}
</script>

<template>
  <div class="min-h-screen bg-[#0f172a] text-primary-200">
    <!-- Nav -->
    <header class="sticky top-0 z-40 border-b border-primary-400/10 bg-[#0f172a]/95 backdrop-blur">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <a
          href="#top"
          class="text-sm tracking-[0.25em] text-primary-100 uppercase transition hover:text-primary-400"
          style="font-family: 'Playfair Display', serif"
        >
          {{ data.full_name }}
        </a>
        <div class="flex items-center gap-8 sm:gap-10">
          <a
            href="#work"
            class="text-[11px] tracking-[0.25em] text-primary-400 uppercase transition hover:text-primary-400"
            style="font-family: 'JetBrains Mono', monospace"
          >
            {{ data.button_texts?.nav_projects || `<a
            href="#work"
            class="text-[11px] tracking-[0.25em] text-primary-400 uppercase transition hover:text-primary-400"
            style="font-family: 'JetBrains Mono', monospace"
          >
            Work
          </a>`.replace(/<[^>]+>/g, '').trim() }}
          </a>
          <a
            href="#skills"
            class="text-[11px] tracking-[0.25em] text-primary-400 uppercase transition hover:text-primary-400"
            style="font-family: 'JetBrains Mono', monospace"
          >
            {{ data.button_texts?.nav_skills || `<a
            href="#skills"
            class="text-[11px] tracking-[0.25em] text-primary-400 uppercase transition hover:text-primary-400"
            style="font-family: 'JetBrains Mono', monospace"
          >
            Skills
          </a>`.replace(/<[^>]+>/g, '').trim() }}
          </a>
          <a
            href="#contact"
            class="hidden text-[11px] tracking-[0.25em] text-primary-400 uppercase transition hover:text-primary-400 sm:inline"
            style="font-family: 'JetBrains Mono', monospace"
          >
            {{ data.button_texts?.contact_cta || data.cta_text || 'Contact' }}
          </a>
          <a
            :href="primaryCta.href"
            :target="primaryCta.external ? '_blank' : undefined"
            :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
            class="rounded-full border border-primary-400/50 px-5 py-2 text-[11px] tracking-[0.2em] text-primary-400 uppercase transition hover:border-primary-400 hover:bg-primary-400/10"
            style="font-family: 'JetBrains Mono', monospace"
          >
            Contact
          </a>
        </div>
      </nav>
    </header>

    <!-- Hero -->
    <section
      id="top"
      class="relative mx-auto flex max-w-4xl flex-col items-center px-6 pt-28 pb-24 text-center sm:px-10 sm:pt-36 sm:pb-32"
    >
      <!-- Ambient gold glow -->
      <div
        class="pointer-events-none absolute top-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style="background: radial-gradient(circle, #fbbf24 0%, transparent 70%)"
        aria-hidden="true"
      ></div>

      <!-- Thin gold rule -->
      <div class="relative mb-10 flex items-center gap-4">
        <span class="h-px w-10 bg-gradient-to-r from-transparent to-primary-400/70"></span>
        <span class="material-symbols-outlined text-sm text-primary-400/80">workspace_premium</span>
        <span class="h-px w-10 bg-gradient-to-l from-transparent to-primary-400/70"></span>
      </div>

      <!-- Portrait medallion -->
      <div v-if="initials" class="relative mb-10 flex h-40 w-40 items-center justify-center rounded-full sm:h-48 sm:w-48">
        <div
          class="absolute inset-0 rounded-full"
          style="
            background: radial-gradient(circle at 35% 30%, #1e293b 0%, #0f172a 70%);
            box-shadow:
              inset 0 0 0 1px rgba(251, 191, 36, 0.35),
              0 0 60px rgba(251, 191, 36, 0.12);
          "
        ></div>
        <div class="absolute inset-[6px] rounded-full border border-primary-400/60"></div>
        <span
          class="relative text-4xl tracking-wide text-primary-300 sm:text-5xl"
          style="font-family: 'Playfair Display', serif"
        >
          {{ initials }}
        </span>
      </div>

      <h1
        class="relative text-4xl leading-tight font-normal text-primary-50 sm:text-6xl md:text-7xl"
        style="font-family: 'Playfair Display', serif"
      >
        {{ data.full_name }}
      </h1>

      <p
        v-if="tagline"
        class="relative mt-6 max-w-xl text-sm tracking-[0.08em] text-primary-400 sm:text-base"
      >
        {{ tagline }}
      </p>

      <!-- Thin gold rule -->
      <div class="relative mt-12 flex items-center gap-4">
        <span class="h-px w-16 bg-gradient-to-r from-transparent to-primary-400/50"></span>
        <span class="h-1.5 w-1.5 rotate-45 bg-primary-400/70"></span>
        <span class="h-px w-16 bg-gradient-to-l from-transparent to-primary-400/50"></span>
      </div>

      <div class="relative mt-12 flex flex-wrap items-center justify-center gap-4">
        <a
          href="#work"
          class="inline-flex items-center gap-2 rounded-full bg-primary-400 px-7 py-3 text-xs font-medium tracking-[0.2em] text-primary-900 uppercase transition hover:bg-primary-300"
          style="font-family: 'JetBrains Mono', monospace"
        >
          <span>Leadership highlights</span>
          <span class="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="inline-flex items-center gap-2 rounded-full border border-primary-400/40 px-7 py-3 text-xs tracking-[0.2em] text-primary-300 uppercase transition hover:border-primary-400 hover:bg-primary-400/10"
          style="font-family: 'JetBrains Mono', monospace"
        >
          <span>Get in touch</span>
        </a>
      </div>
    </section>

    <!-- Executive Summary -->
    <section
      v-if="data.professional_bio"
      class="border-t border-primary-400/10 px-6 py-24 sm:px-10 sm:py-28"
    >
      <div class="mx-auto max-w-3xl text-center">
        <p
          class="mb-8 text-xs tracking-[0.4em] text-primary-400/80 uppercase"
          style="font-family: 'JetBrains Mono', monospace"
        >
          {{ data.section_titles?.profile || 'Executive Summary' }}
        </p>
        <p
          class="text-xl leading-[1.9] text-primary-300 sm:text-2xl"
          style="font-family: 'Playfair Display', serif"
        >
          {{ data.professional_bio }}
        </p>
      </div>
    </section>

    <template v-for="section in sections" :key="section.key">
      <!-- Work / Leadership Highlights -->
      <section
        v-if="section.kind === 'projects'"
        id="work"
        class="border-t border-primary-400/10 px-6 py-24 sm:px-10 sm:py-28"
      >
        <div class="mx-auto max-w-5xl">
          <div class="mb-16 text-center">
            <p
              class="mb-4 text-xs tracking-[0.4em] text-primary-400/80 uppercase"
              style="font-family: 'JetBrains Mono', monospace"
            >
              Track Record
            </p>
            <h2 class="text-3xl text-primary-50 sm:text-4xl" style="font-family: 'Playfair Display', serif">
              {{ section.title }}
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
                class="group relative h-full rounded-sm border border-primary-400/20 bg-white/[0.02] p-8 transition group-hover:border-primary-400/50 group-hover:bg-white/[0.04]"
              >
                <!-- Corner accents -->
                <span class="absolute top-0 left-0 h-4 w-4 border-t border-l border-primary-400/60"></span>
                <span class="absolute top-0 right-0 h-4 w-4 border-t border-r border-primary-400/60"></span>
                <span class="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-primary-400/60"></span>
                <span class="absolute right-0 bottom-0 h-4 w-4 border-r border-b border-primary-400/60"></span>

                <div class="mb-4 flex items-center justify-between">
                  <span
                    class="block text-[11px] tracking-[0.3em] text-primary-400/60"
                    style="font-family: 'JetBrains Mono', monospace"
                  >
                    {{ pad(index) }}
                  </span>
                  <span
                    v-if="hasLink"
                    class="material-symbols-outlined text-primary-400/70"
                    aria-hidden="true"
                  >
                    open_in_new
                  </span>
                </div>
                <h3
                  class="mb-4 text-2xl text-primary-50"
                  style="font-family: 'Playfair Display', serif"
                >
                  {{ project.title }}
                </h3>
                <p v-if="project.description" class="mb-6 text-[15px] leading-relaxed text-primary-400">
                  {{ project.description }}
                </p>
                <div
                  v-if="project.tech_stack && project.tech_stack.length"
                  class="flex flex-wrap gap-2"
                >
                  <span
                    v-for="tech in project.tech_stack"
                    :key="tech"
                    class="rounded-full border border-primary-400/25 px-3 py-1 text-[10px] tracking-[0.15em] text-primary-300/90 uppercase"
                    style="font-family: 'JetBrains Mono', monospace"
                  >
                    {{ tech }}
                  </span>
                </div>
                <p
                  v-if="hasLink"
                  class="mt-5 text-[11px] tracking-[0.2em] text-primary-400 uppercase"
                  style="font-family: 'JetBrains Mono', monospace"
                >
                  Open project →
                </p>
              </div>
            </PortfolioProjectLink>
          </div>
        </div>
      </section>

      <!-- Core Competencies -->
      <section
        v-else-if="section.kind === 'skills'"
        id="skills"
        class="border-t border-primary-400/10 px-6 py-24 sm:px-10 sm:py-28"
      >
        <div class="mx-auto max-w-4xl">
          <div class="mb-16 text-center">
            <p
              class="mb-4 text-xs tracking-[0.4em] text-primary-400/80 uppercase"
              style="font-family: 'JetBrains Mono', monospace"
            >
              Expertise
            </p>
            <h2 class="text-3xl text-primary-50 sm:text-4xl" style="font-family: 'Playfair Display', serif">
              {{ section.title }}
            </h2>
          </div>

          <div class="grid grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2">
            <div
              v-for="skill in data.core_skills"
              :key="skill"
              class="flex items-center gap-4 border-b border-primary-400/10 pb-5"
            >
              <span class="h-1.5 w-1.5 shrink-0 rotate-45 bg-primary-400"></span>
              <span class="text-base tracking-wide text-primary-300 sm:text-lg">{{ skill }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Custom section -->
      <section
        v-else-if="section.custom && section.custom.content && section.custom.content.trim()"
        :id="`section-${section.key}`"
        class="border-t border-primary-400/10 px-6 py-24 sm:px-10 sm:py-28"
      >
        <div class="mx-auto max-w-3xl text-center">
          <div class="mb-16 flex items-center justify-center gap-4">
            <span class="h-px w-10 bg-gradient-to-r from-transparent to-primary-400/70"></span>
            <span class="material-symbols-outlined text-sm text-primary-400/80">workspace_premium</span>
            <span class="h-px w-10 bg-gradient-to-l from-transparent to-primary-400/70"></span>
          </div>
          <h2
            class="mb-10 text-3xl text-primary-50 sm:text-4xl"
            style="font-family: 'Playfair Display', serif"
          >
            {{ section.title }}
          </h2>

          <div class="space-y-6 text-left">
            <p
              v-for="(paragraph, index) in section.custom.content.split(/\n{2,}/)"
              :key="index"
              class="text-lg leading-[1.9] text-primary-300"
              style="font-family: 'Playfair Display', serif"
            >
              {{ paragraph }}
            </p>
          </div>
        </div>
      </section>
    </template>

    <!-- Footer / Contact -->
    <footer id="contact" class="relative border-t border-primary-400/10 px-6 py-24 sm:px-10 sm:py-32">
      <div
        class="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full opacity-15 blur-3xl"
        style="background: radial-gradient(circle, #fbbf24 0%, transparent 70%)"
        aria-hidden="true"
      ></div>

      <div class="relative mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <div class="flex items-center gap-4">
          <span class="h-px w-10 bg-gradient-to-r from-transparent to-primary-400/70"></span>
          <span class="material-symbols-outlined text-sm text-primary-400/80">workspace_premium</span>
          <span class="h-px w-10 bg-gradient-to-l from-transparent to-primary-400/70"></span>
        </div>

        <h2
          class="text-4xl text-primary-50 sm:text-5xl"
          style="font-family: 'Playfair Display', serif"
        >
          It would be an honor to work together.
        </h2>

        <a
          :href="primaryCta.href"
          :target="primaryCta.external ? '_blank' : undefined"
          :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
          class="inline-flex items-center gap-2 rounded-full bg-primary-400 px-8 py-3 text-xs font-medium tracking-[0.2em] text-primary-900 uppercase transition hover:bg-primary-300"
          style="font-family: 'JetBrains Mono', monospace"
        >
          <span>Start the conversation</span>
          <span class="material-symbols-outlined text-sm">north_east</span>
        </a>

        <PortfolioContactLinks
          :data="data"
          variant="row"
          class-name="justify-center text-primary-400 [&_a]:text-primary-300"
        />

        <p
          class="mt-6 text-[11px] tracking-[0.25em] text-primary-500 uppercase"
          style="font-family: 'JetBrains Mono', monospace"
        >
          {{ data.full_name }} &mdash; <a href="#top" class="transition hover:text-primary-400">Back to top</a>
        </p>
      </div>
    </footer>
  </div>
</template>
