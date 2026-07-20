<script setup lang="ts">
import type { PortfolioProfileData } from '~/shared/types/portfolio'
import { absoluteUrl, mailtoHref, telHref } from '~/shared/types/portfolio'

const props = withDefaults(
  defineProps<{
    data: PortfolioProfileData
    /** Visual density for embedding in different themes. */
    variant?: 'stack' | 'row' | 'pills'
    /** Optional class on the outer wrapper. */
    className?: string
  }>(),
  { variant: 'stack', className: '' },
)

const email = computed(() => mailtoHref(props.data.email))
const phone = computed(() => telHref(props.data.phone))

function extractUrl(val: string | { label: string, url: string } | undefined | null) {
  if (!val) return null
  return absoluteUrl(typeof val === 'string' ? val : val.url)
}

function extractLabel(val: string | { label: string, url: string } | undefined | null, defaultLabel: string) {
  if (!val) return defaultLabel
  return typeof val === 'string' ? val : val.label
}

const website = computed(() => extractUrl(props.data.website))
const linkedin = computed(() => extractUrl(props.data.linkedin))
const github = computed(() => extractUrl(props.data.github))
const resume = computed(() => extractUrl(props.data.resume))

const links = computed(() => {
  const items: Array<{ key: string; label: string; href: string; icon: string }> = []
  if (email.value && props.data.email) {
    items.push({ key: 'email', label: props.data.email, href: email.value, icon: 'mail' })
  }
  if (phone.value && props.data.phone) {
    items.push({ key: 'phone', label: props.data.phone, href: phone.value, icon: 'call' })
  }
  if (props.data.location) {
    items.push({
      key: 'location',
      label: props.data.location,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.data.location)}`,
      icon: 'location_on',
    })
  }
  if (website.value) {
    items.push({
      key: 'website',
      label: extractLabel(props.data.website, 'Website'),
      href: website.value,
      icon: 'language',
    })
  }
  if (linkedin.value) {
    items.push({
      key: 'linkedin',
      label: extractLabel(props.data.linkedin, 'LinkedIn'),
      href: linkedin.value,
      icon: 'work',
    })
  }
  if (github.value) {
    items.push({
      key: 'github',
      label: extractLabel(props.data.github, 'GitHub'),
      href: github.value,
      icon: 'code',
    })
  }
  if (resume.value) {
    items.push({
      key: 'resume',
      label: extractLabel(props.data.resume, 'Resume'),
      href: resume.value,
      icon: 'description',
    })
  }
  return items
})

const primaryCta = computed(() => {
  const ctaLabel = props.data.button_texts?.contact_cta || props.data.cta_text
  if (ctaLabel) {
    if (email.value) return { href: email.value, label: ctaLabel }
    if (linkedin.value) return { href: linkedin.value, label: ctaLabel }
    if (website.value) return { href: website.value, label: ctaLabel }
    return { href: '#contact', label: ctaLabel }
  }
  if (email.value) return { href: email.value, label: 'Email me' }
  if (linkedin.value) return { href: linkedin.value, label: 'Connect on LinkedIn' }
  if (website.value) return { href: website.value, label: 'Visit website' }
  return { href: '#contact', label: 'Get in touch' }
})
</script>

<template>
  <div v-if="links.length" :class="className">
    <div
      v-if="variant === 'row'"
      class="flex flex-wrap items-center gap-x-5 gap-y-2"
    >
      <a
        v-for="link in links"
        :key="link.key"
        :href="link.href"
        class="inline-flex items-center gap-1.5 underline-offset-4 transition hover:underline"
        :target="link.href.startsWith('http') ? '_blank' : undefined"
        :rel="link.href.startsWith('http') ? 'noopener noreferrer' : undefined"
      >
        <span class="material-symbols-outlined text-base">{{ link.icon }}</span>
        <span>{{ link.label }}</span>
      </a>
    </div>

    <div v-else-if="variant === 'pills'" class="flex flex-wrap gap-2">
      <a
        v-for="link in links"
        :key="link.key"
        :href="link.href"
        class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition hover:opacity-90"
        :target="link.href.startsWith('http') ? '_blank' : undefined"
        :rel="link.href.startsWith('http') ? 'noopener noreferrer' : undefined"
      >
        <span class="material-symbols-outlined text-base">{{ link.icon }}</span>
        {{ link.label }}
      </a>
    </div>

    <ul v-else class="space-y-2">
      <li v-for="link in links" :key="link.key">
        <a
          :href="link.href"
          class="inline-flex items-center gap-2 underline-offset-4 transition hover:underline"
          :target="link.href.startsWith('http') ? '_blank' : undefined"
          :rel="link.href.startsWith('http') ? 'noopener noreferrer' : undefined"
        >
          <span class="material-symbols-outlined text-base">{{ link.icon }}</span>
          {{ link.label }}
        </a>
      </li>
    </ul>
  </div>

  <!-- Expose primary CTA for parent themes via slot usage -->
  <slot name="cta" :cta="primaryCta" :links="links" />
</template>
