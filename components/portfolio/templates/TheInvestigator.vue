<script setup lang="ts">
import { portfolioContactCta } from '~/composables/usePortfolioContact'
import type { PortfolioProfileData } from '~/shared/types/portfolio'
import { orderedBodySections } from '~/shared/types/portfolio'

const props = defineProps<{ data: PortfolioProfileData }>()

const sections = computed(() =>
  orderedBodySections(props.data, {
    projects: 'Publications & Projects',
    skills: 'Fields of Focus',
  }),
)

const initials = computed(() => {
  const parts = props.data.full_name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
})

const bioSentences = computed(() => {
  const bio = props.data.professional_bio?.trim() ?? ''
  if (!bio) return []
  const matches = bio.match(/[^.!?]+[.!?]+(\s+|$)/g)
  if (!matches) return [bio]
  return matches.map((s) => s.trim()).filter(Boolean)
})

const tagline = computed(() => bioSentences.value[0] ?? props.data.professional_bio ?? '')

const primaryCta = computed(() => portfolioContactCta())

function romanNumeral(n: number) {
  const numerals: Array<[number, string]> = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let value = n
  let out = ''
  for (const [amount, symbol] of numerals) {
    while (value >= amount) {
      out += symbol
      value -= amount
    }
  }
  return out
}

function paddedIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}
</script>

<template>
  <div
    id="top"
    class="min-h-screen"
    style="background-color: #fbfbf9; color: #1c1c1a; font-family: 'Georgia', 'Iowan Old Style', serif;"
  >
    <!-- Top nav -->
    <header class="sticky top-0 z-50 border-b border-primary-900/15 bg-[#fbfbf9]/95 backdrop-blur-sm">
      <nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <a
          href="#top"
          class="flex items-center gap-3 text-primary-900"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full border border-primary-900/40 text-xs font-semibold tracking-wide text-primary-900"
          >
            {{ initials }}
          </span>
          <span
            class="text-base tracking-wide"
            style="font-family: 'Playfair Display', serif;"
          >
            {{ data.full_name }}
          </span>
        </a>

        <div class="flex items-center gap-7 text-sm">
          <a href="#work" class="hidden text-primary-900/70 transition hover:text-primary-900 sm:inline">
            {{ data.button_texts?.nav_projects || `<a href="#work" class="hidden text-primary-900/70 transition hover:text-primary-900 sm:inline">
            Work
          </a>`.replace(/<[^>]+>/g, '').trim() }}
          </a>
          <a href="#skills" class="hidden text-primary-900/70 transition hover:text-primary-900 sm:inline">
            {{ data.button_texts?.nav_skills || `<a href="#skills" class="hidden text-primary-900/70 transition hover:text-primary-900 sm:inline">
            Skills
          </a>`.replace(/<[^>]+>/g, '').trim() }}
          </a>
          <a href="#contact" class="hidden text-primary-900/70 transition hover:text-primary-900 sm:inline">
            {{ data.button_texts?.contact_cta || data.cta_text || 'Contact' }}
          </a>
          <a
            :href="primaryCta.href"
            :target="primaryCta.external ? '_blank' : undefined"
            :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
            class="rounded-sm border border-primary-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary-900 transition hover:bg-primary-900 hover:text-white"
          >
            Contact
          </a>
        </div>
      </nav>
    </header>

    <!-- Hero -->
    <section class="mx-auto max-w-5xl px-6 py-20 sm:py-28">
      <div class="grid items-center gap-14 md:grid-cols-[auto_1fr]">
        <!-- Framed portrait built from initials -->
        <div class="mx-auto md:mx-0">
          <div class="border border-primary-900/50 p-2">
            <div
              class="flex h-40 w-40 items-center justify-center border border-primary-900/20 bg-[#f3f2ec] text-5xl text-primary-900 sm:h-48 sm:w-48"
              style="font-family: 'Playfair Display', serif;"
            >
              {{ initials }}
            </div>
          </div>
          <p class="mt-3 text-center text-xs uppercase tracking-[0.2em] text-primary-900/60">
            Curriculum&nbsp;Vitae
          </p>
        </div>

        <div>
          <p class="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60">
            Independent Research &amp; Practice
          </p>
          <h1
            class="text-4xl leading-tight text-primary-900 sm:text-5xl"
            style="font-family: 'Playfair Display', serif;"
          >
            Dr. {{ data.full_name }}
          </h1>
          <p v-if="tagline" class="mt-6 max-w-2xl text-lg leading-relaxed text-[#3a3a36]">
            {{ tagline }}
          </p>
          <div class="mt-9 flex flex-wrap items-center gap-8 text-sm">
            <a
              href="#work"
              class="border-b border-primary-900/40 pb-0.5 text-primary-900 transition hover:border-primary-900"
            >
              Read selected work &rarr;
            </a>
            <a
              :href="primaryCta.href"
              :target="primaryCta.external ? '_blank' : undefined"
              :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
              class="border-b border-primary-900/40 pb-0.5 text-primary-900 transition hover:border-primary-900"
            >
              Get in touch &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>

    <hr class="mx-auto max-w-5xl border-primary-900/15" />

    <!-- Research Statement / About -->
    <section v-if="bioSentences.length" class="mx-auto max-w-5xl px-6 py-20">
      <p class="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60">
        {{ data.section_titles?.profile || 'Research Statement' }}
      </p>
      <div class="max-w-3xl space-y-5 text-[1.05rem] leading-[1.9] text-[#3a3a36]">
        <p v-for="(sentence, index) in bioSentences" :key="index">
          {{ sentence }}
        </p>
      </div>
    </section>

    <hr v-if="bioSentences.length" class="mx-auto max-w-5xl border-primary-900/15" />

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
        class="mx-auto max-w-5xl px-6 py-20"
      >
        <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60">
          Selected Work
        </p>
        <h2
          class="mb-12 text-3xl text-primary-900 sm:text-4xl"
          style="font-family: 'Playfair Display', serif;"
        >
          {{ section.title }}
        </h2>

        <ol v-if="data.formatted_projects?.length" class="space-y-12">
          <li
            v-for="(project, index) in data.formatted_projects"
            :key="project.title + index"
            class="border-b border-primary-900/10 pb-12 last:border-b-0 last:pb-0"
          >
            <PortfolioProjectLink
              :project="project"
              :index="index"
              v-slot="{ hasLink }"
            >
              <div class="flex gap-6 sm:gap-8">
                <span
                  class="shrink-0 pt-1 text-sm text-primary-900/50"
                  style="font-family: 'JetBrains Mono', monospace;"
                >
                  {{ paddedIndex(index) }} &middot; {{ romanNumeral(index + 1) }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start gap-2">
                    <h3
                      class="text-xl text-primary-900 sm:text-2xl"
                      style="font-family: 'Playfair Display', serif;"
                    >
                      {{ project.title }}
                    </h3>
                    <span
                      v-if="hasLink"
                      class="material-symbols-outlined mt-1 shrink-0 text-primary-900/60"
                      aria-hidden="true"
                    >
                      open_in_new
                    </span>
                  </div>
                  <PortfolioRichText class="mt-3 max-w-3xl text-base leading-[1.85] text-[#3a3a36]" :content="project.description" />
                  <div v-if="project.tech_stack && project.tech_stack.length > 0" class="mt-5">
                    <p class="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary-900/50">
                      Methods &amp; Tools
                    </p>
                    <div class="flex flex-wrap gap-x-5 gap-y-2">
                      <span
                        v-for="tech in project.tech_stack"
                        :key="tech"
                        class="text-xs text-primary-900/80"
                        style="font-family: 'JetBrains Mono', monospace;"
                      >
                        {{ tech }}
                      </span>
                    </div>
                  </div>
                  <p
                    v-if="hasLink"
                    class="mt-4 text-sm text-primary-900 underline-offset-4 group-hover:underline"
                  >
                    Open project &rarr;
                  </p>
                </div>
              </div>
            </PortfolioProjectLink>
          </li>
        </ol>
      </section>

      <section
        v-else-if="section.kind === 'skills'"
        id="skills"
        class="mx-auto max-w-5xl px-6 py-20"
      >
        <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60">
          Areas of Expertise
        </p>
        <h2
          class="mb-10 text-3xl text-primary-900 sm:text-4xl"
          style="font-family: 'Playfair Display', serif;"
        >
          {{ section.title }}
        </h2>

        <ul v-if="data.core_skills?.length" class="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          <li
            v-for="(skill, index) in data.core_skills"
            :key="skill"
            class="flex items-baseline gap-4 border-b border-primary-900/10 pb-3"
          >
            <span
              class="text-xs text-primary-900/40"
              style="font-family: 'JetBrains Mono', monospace;"
            >
              {{ paddedIndex(index) }}
            </span>
            <span class="text-base text-[#3a3a36]">{{ skill }}</span>
          </li>
        </ul>
      </section>

      <section
        v-else-if="section.custom && section.custom.content?.trim()"
        :id="`section-${section.key}`"
        class="mx-auto max-w-5xl px-6 py-20"
      >
        <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60">
          {{ section.title }}
        </p>
        <h2
          class="mb-8 text-3xl text-primary-900 sm:text-4xl"
          style="font-family: 'Playfair Display', serif;"
        >
          {{ section.title }}
        </h2>
        <div class="max-w-3xl space-y-5 text-[1.05rem] leading-[1.9] text-[#3a3a36]">
          <p
            v-for="(paragraph, pIdx) in section.custom.content.split(/\n{2,}/)"
            :key="pIdx"
          >
            {{ paragraph.trim() }}
          </p>
        </div>
      </section>

      <hr class="mx-auto max-w-5xl border-primary-900/15" />
    </template>

    <!-- Contact footer -->
    <footer id="contact" class="border-t border-primary-900/15 bg-[#f3f2ec] px-6 py-20">
      <div class="mx-auto max-w-5xl">
        <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary-900/60">
          Correspondence
        </p>
        <h2
          class="mb-5 max-w-2xl text-3xl leading-tight text-primary-900 sm:text-4xl"
          style="font-family: 'Playfair Display', serif;"
        >
          Inquiries regarding collaboration, review, or consultation are welcome.
        </h2>
        <p class="mb-9 max-w-2xl text-base leading-relaxed text-[#3a3a36]">
          {{ data.full_name }} welcomes correspondence from colleagues, institutions, and
          collaborators interested in this body of work.
        </p>

        <div class="flex flex-wrap items-center gap-8">
          <a
            :href="primaryCta.href"
            :target="primaryCta.external ? '_blank' : undefined"
            :rel="primaryCta.external ? 'noopener noreferrer' : undefined"
            class="inline-flex items-center gap-2 rounded-sm border border-primary-900 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-900 transition hover:bg-primary-900 hover:text-white"
          >
            <span class="material-symbols-outlined text-base">mail</span>
            Write to {{ data.full_name }}
          </a>
          <a
            href="#top"
            class="text-sm text-primary-900/60 underline-offset-4 transition hover:text-primary-900 hover:underline"
          >
            Back to top
          </a>
        </div>

        <PortfolioContactLinks
          :data="data"
          variant="stack"
          class-name="mt-10 text-primary-900/80 [&_a]:text-primary-900"
        />

        <p class="mt-14 border-t border-primary-900/10 pt-6 text-xs uppercase tracking-[0.2em] text-primary-900/40">
          {{ data.full_name }} &mdash; Research &amp; Practice
        </p>
      </div>
    </footer>
  </div>
</template>
