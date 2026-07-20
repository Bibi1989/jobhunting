<script setup lang="ts">
/**
 * Floating "Get in touch" + modal. Hiring-manager messages POST to
 * /api/portfolio/:id/contact and are emailed to the portfolio owner.
 *
 * Also intercepts in-template `#contact` / matching mailto clicks so every
 * template CTA opens this form instead of only scrolling or opening mail.app.
 */
import { portfolioContactKey } from '~/composables/usePortfolioContact'

const props = defineProps<{
  portfolioId: string
  ownerName?: string
  /** Used to intercept mailto: links that target the owner. */
  ownerEmail?: string
  /** When true, the button/submit are inert (used inside the editor preview). */
  demo?: boolean
}>()

const open = ref(false)
const sending = ref(false)
const done = ref(false)
const errorMsg = ref('')

const form = reactive({ name: '', email: '', message: '' })

function reset() {
  form.name = ''
  form.email = ''
  form.message = ''
  done.value = false
  errorMsg.value = ''
}

function openModal() {
  reset()
  open.value = true
}

provide(portfolioContactKey, openModal)

async function submit() {
  if (props.demo) {
    done.value = true
    return
  }
  errorMsg.value = ''
  if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.message.trim().length < 5) {
    errorMsg.value = 'Please enter your name, a valid email, and a short message.'
    return
  }
  sending.value = true
  try {
    await $fetch(`/api/portfolio/${props.portfolioId}/contact`, {
      method: 'POST',
      body: { name: form.name, email: form.email, message: form.message },
    })
    done.value = true
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    errorMsg.value = e.data?.statusMessage || e.statusMessage || 'Could not send. Please try again.'
  } finally {
    sending.value = false
  }
}

function shouldIntercept(href: string): boolean {
  const value = (href || '').trim()
  if (!value) return false
  if (value === '#contact' || value.endsWith('#contact')) return true
  const owner = (props.ownerEmail || '').trim().toLowerCase()
  if (owner && value.toLowerCase() === `mailto:${owner}`) return true
  return false
}

function onDocumentClick(event: MouseEvent) {
  if (props.demo) return
  const target = event.target as HTMLElement | null
  const anchor = target?.closest?.('a') as HTMLAnchorElement | null
  if (!anchor) return
  const href = anchor.getAttribute('href') || ''
  if (!shouldIntercept(href)) return
  event.preventDefault()
  openModal()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick, true)
})

defineExpose({ openModal })
</script>

<template>
  <div>
    <button
      type="button"
      class="fixed bottom-6 right-6 z-[90] inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 shadow-2xl shadow-indigo-900/40 transition"
      @click="openModal"
    >
      <span class="material-symbols-outlined text-[20px]">mail</span>
      Get in touch
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
        @click.self="open = false"
      >
        <div class="w-full max-w-md rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden">
          <div class="flex items-center justify-between px-6 h-14 border-b border-slate-100">
            <h2 class="font-semibold">
              Contact {{ ownerName || '' }}
            </h2>
            <button type="button" class="text-slate-400 hover:text-slate-700" @click="open = false">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div v-if="done" class="p-8 text-center">
            <div class="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <span class="material-symbols-outlined text-emerald-600">check</span>
            </div>
            <p class="font-semibold text-lg">Message sent</p>
            <p class="text-slate-500 mt-1 text-sm">
              Thanks for reaching out{{ form.name ? `, ${form.name}` : '' }}. You'll hear back soon.
            </p>
            <button
              type="button"
              class="mt-5 rounded-lg bg-slate-900 text-white px-5 py-2.5 font-semibold hover:bg-slate-700"
              @click="open = false"
            >
              Close
            </button>
          </div>

          <form v-else class="p-6 space-y-4" @submit.prevent="submit">
            <p class="text-sm text-slate-500">
              Send a note and it will be delivered to {{ ownerName || 'the portfolio owner' }}'s email inbox.
            </p>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Your name</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                placeholder="Jane Recruiter"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Your email</label>
              <input
                v-model="form.email"
                type="email"
                required
                class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                placeholder="jane@company.com"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Message</label>
              <textarea
                v-model="form.message"
                rows="4"
                required
                class="w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="I'd love to talk about a role…"
              ></textarea>
            </div>
            <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
            <p v-if="demo" class="text-xs text-amber-600">Preview only — messages aren't sent from the editor.</p>
            <button
              type="submit"
              class="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 transition disabled:opacity-50"
              :disabled="sending"
            >
              {{ sending ? 'Sending…' : 'Send message' }}
            </button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
