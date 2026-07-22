<script setup lang="ts">
/**
 * Public privacy policy for JobFlow web app + Chrome extension.
 * Chrome Web Store requires a stable HTTPS URL — use your production origin + /privacy
 */
definePageMeta({
  layout: false,
})

useHead({
  title: 'Privacy Policy — JobFlow',
  meta: [
    {
      name: 'description',
      content:
        'How JobFlow and the JobFlow Chrome extension collect, use, and protect your data.',
    },
  ],
})

const config = useRuntimeConfig()
const appName = computed(() => String(config.public.appName || 'JobFlow'))
const updated = 'July 23, 2026'
</script>

<template>
  <div class="min-h-dvh" style="background: var(--app-bg); color: var(--app-fg)">
    <header class="border-b px-6 py-4" style="border-color: var(--app-border)">
      <div class="max-w-3xl mx-auto flex items-center justify-between gap-4">
        <AppLogo size="sm" :show-tagline="false" />
        <NuxtLink
          to="/"
          class="text-sm font-semibold transition-opacity hover:opacity-80"
          style="color: var(--app-muted)"
        >
          Home
        </NuxtLink>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-6 py-12 prose-invert">
      <p class="text-xs font-bold uppercase tracking-widest mb-3" style="color: var(--app-accent)">
        Legal
      </p>
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
      <p class="text-sm mb-10" style="color: var(--app-muted)">
        Last updated: {{ updated }} · Applies to {{ appName }} (web app) and the
        {{ appName }} Chrome extension.
      </p>

      <section class="space-y-8 text-sm leading-relaxed" style="color: var(--app-muted)">
        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">1. Overview</h2>
          <p>
            {{ appName }} helps you capture job descriptions and tailor resumes and cover letters.
            We collect only what is needed to run the product. We do not sell your personal data.
          </p>
        </div>

        <div id="extension">
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">2. Chrome extension</h2>
          <p class="mb-3">
            The extension’s single purpose is to capture a job description from the page you choose
            and open or tailor documents in {{ appName }}.
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li>
              <strong style="color: var(--app-fg)">Website content:</strong>
              When you click Capture (or similar), the extension reads visible text from the active
              tab so it can extract the job posting. This happens only after you invoke the
              extension — not in the background across browsing.
            </li>
            <li>
              <strong style="color: var(--app-fg)">Authentication / session:</strong>
              For “Tailor now” and related API calls, the extension sends requests to your configured
              {{ appName }} origin with cookies
              (<code class="text-xs">credentials: include</code>) so you stay signed in. Credentials
              are not sent to job boards.
            </li>
            <li>
              <strong style="color: var(--app-fg)">Local settings:</strong>
              App URL, tailoring preset, and similar preferences are stored in Chrome
              <code class="text-xs">storage</code> on your device.
            </li>
            <li>
              <strong style="color: var(--app-fg)">Install detection:</strong>
              On {{ appName }} pages, a content script may set a local flag so the web app can hide
              the install banner.
            </li>
          </ul>
          <p class="mt-3">
            The extension does not sell data, does not use data for unrelated advertising, and does
            not transfer captured job text to third parties other than your configured
            {{ appName }} backend when you use product features.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">3. Web application</h2>
          <p class="mb-3">When you use the {{ appName }} website, we may process:</p>
          <ul class="list-disc pl-5 space-y-2">
            <li>Account details (such as email) for sign-in and account management</li>
            <li>Resume, cover letter, and job description content you upload or generate</li>
            <li>Usage and credit/plan information needed to provide the service</li>
            <li>Technical logs (IP, browser type, error diagnostics) for security and reliability</li>
          </ul>
          <p class="mt-3">
            AI features may send document text you provide to our model providers solely to generate
            or analyze content you requested. We do not use that content to sell ads.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">4. Legal bases & retention</h2>
          <p>
            We process data to provide the service you request, to secure accounts, and to improve
            reliability. We retain account and document data while your account is active and as
            needed for legal or abuse-prevention purposes. You may request deletion of your account
            data by contacting us (see below).
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">5. Sharing</h2>
          <p>
            We share data with infrastructure and AI providers only as required to operate
            {{ appName }}, under contractual obligations. We do not sell personal information.
            We may disclose information if required by law or to protect users and the service.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">6. Security</h2>
          <p>
            We use industry-standard measures such as HTTPS and httpOnly session cookies. No method
            of transmission or storage is 100% secure; please protect your account credentials.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">7. Children</h2>
          <p>
            {{ appName }} is not directed at children under 13 (or the equivalent minimum age in your
            jurisdiction). We do not knowingly collect their data.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">8. Changes</h2>
          <p>
            We may update this policy. The “Last updated” date will change when we do. Continued use
            after updates constitutes acceptance of the revised policy.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-2" style="color: var(--app-fg)">9. Contact</h2>
          <p>
            Questions about privacy or data deletion:
            <a
              class="underline"
              style="color: var(--app-accent)"
              href="mailto:privacy@jobflow.app"
            >privacy@jobflow.app</a>
            (replace with your real support email before publishing).
          </p>
        </div>
      </section>
    </main>

    <footer class="border-t px-6 py-8 text-center text-sm" style="border-color: var(--app-border); color: var(--app-muted)">
      © {{ new Date().getFullYear() }} {{ appName }} ·
      <NuxtLink to="/privacy" class="underline">Privacy</NuxtLink>
    </footer>
  </div>
</template>
