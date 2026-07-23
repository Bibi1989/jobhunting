import {
  JOBFLOW_EXTENSION_SOURCE,
  JOBFLOW_WEB_SOURCE,
  LINKEDIN_NEW_POSITION_URL,
  STAGE_LINKEDIN_EXPERIENCE,
  STAGE_LINKEDIN_EXPERIENCE_ACK,
  builderExperienceToLinkedInPayload,
  formatLinkedInDescription,
  type LinkedInExperiencePayload,
  type StageLinkedInExperienceAck,
} from '~/shared/linkedinExperience'
import type { BuilderExperience } from '~/shared/types/builder'

const ACK_TIMEOUT_MS = 2500

/**
 * Stage a LinkedIn experience payload for the JobFlow extension via
 * same-origin `window.postMessage`, with clipboard / deep-link fallbacks.
 */
export function useLinkedInSync() {
  const { installed } = useJobflowExtension()
  const toast = useAppToast()

  function toPayload(
    experience: Pick<
      BuilderExperience,
      'title' | 'company' | 'location' | 'startDate' | 'endDate' | 'isCurrent' | 'description'
    >,
  ): LinkedInExperiencePayload {
    return builderExperienceToLinkedInPayload(experience)
  }

  /**
   * Post STAGE_LINKEDIN_EXPERIENCE and wait briefly for extension ACK.
   * Resolves `{ ok: true }` when the bridge acknowledges, else `{ ok: false }`.
   */
  function stageForExtension(payload: LinkedInExperiencePayload): Promise<{ ok: boolean; error?: string }> {
    if (!import.meta.client) return Promise.resolve({ ok: false, error: 'Not in browser' })

    return new Promise((resolve) => {
      let settled = false

      const onMessage = (event: MessageEvent) => {
        if (event.source !== window) return
        if (event.origin !== window.location.origin) return
        const data = event.data as StageLinkedInExperienceAck | undefined
        if (!data || data.source !== JOBFLOW_EXTENSION_SOURCE) return
        if (data.type !== STAGE_LINKEDIN_EXPERIENCE_ACK) return
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        window.removeEventListener('message', onMessage)
        resolve({ ok: data.ok === true, error: data.error })
      }

      const timer = window.setTimeout(() => {
        if (settled) return
        settled = true
        window.removeEventListener('message', onMessage)
        resolve({ ok: false, error: 'Extension did not acknowledge staging' })
      }, ACK_TIMEOUT_MS)

      window.addEventListener('message', onMessage)

      window.postMessage(
        {
          source: JOBFLOW_WEB_SOURCE,
          type: STAGE_LINKEDIN_EXPERIENCE,
          data: payload,
        },
        window.location.origin,
      )
    })
  }

  async function autoFillOnLinkedIn(payload: LinkedInExperiencePayload): Promise<boolean> {
    const result = await stageForExtension(payload)
    if (!result.ok) {
      toast.info('Extension did not respond — opening LinkedIn. Use copy/paste if fields are empty.')
      openLinkedInPositionForm()
      return false
    }
    toast.success('Experience staged — LinkedIn will open for review (nothing is saved automatically).')
    return true
  }

  async function copyExperienceBullets(payload: LinkedInExperiencePayload): Promise<boolean> {
    const text =
      formatLinkedInDescription(payload.description) ||
      [payload.title, payload.company].filter(Boolean).join(' · ')
    if (!text.trim()) {
      toast.error('Nothing to copy — add description bullets first.')
      return false
    }
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Highlights bullets copied (• format). Paste into LinkedIn Highlights.')
      return true
    } catch {
      toast.error('Clipboard blocked — select and copy manually.')
      return false
    }
  }

  function downloadExperienceJson(payload: LinkedInExperiencePayload, filenameBase = 'linkedin-experience') {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `${filenameBase.replace(/\.json$/i, '')}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
    toast.success('JSON exported.')
  }

  function openLinkedInPositionForm() {
    window.open(LINKEDIN_NEW_POSITION_URL, '_blank', 'noopener,noreferrer')
  }

  return {
    extensionInstalled: installed,
    toPayload,
    stageForExtension,
    autoFillOnLinkedIn,
    copyExperienceBullets,
    downloadExperienceJson,
    openLinkedInPositionForm,
    LINKEDIN_NEW_POSITION_URL,
  }
}
