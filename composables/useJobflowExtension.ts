/**
 * Detect JobFlow Chrome extension + dismissible install CTA state.
 *
 * Installed = content script ran on THIS page load
 * (`document.documentElement.dataset.jobflowExtension === '1'`).
 * Stale localStorage alone is not trusted (avoids false “already installed”).
 */
export const JOBFLOW_EXTENSION_INSTALLED_KEY = 'jobflow-extension-installed'
export const JOBFLOW_EXTENSION_DISMISSED_KEY = 'jobflow-extension-banner-dismissed'
export const JOBFLOW_EXTENSION_INSTALLED_AT_KEY = 'jobflow-extension-installed-at'

export function clearJobflowExtensionFlags() {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(JOBFLOW_EXTENSION_INSTALLED_KEY)
    localStorage.removeItem(JOBFLOW_EXTENSION_DISMISSED_KEY)
    localStorage.removeItem(JOBFLOW_EXTENSION_INSTALLED_AT_KEY)
  } catch {
    /* ignore */
  }
}

function isExtensionLiveInBrowser(): boolean {
  if (!import.meta.client) return false
  return document.documentElement.dataset.jobflowExtension === '1'
}

export function useJobflowExtension() {
  const installed = ref(false)
  const dismissed = ref(false)
  const checking = ref(true)

  let retryTimers: number[] = []

  function readDismissed() {
    try {
      dismissed.value = localStorage.getItem(JOBFLOW_EXTENSION_DISMISSED_KEY) === '1'
    } catch {
      dismissed.value = false
    }
  }

  function persistLiveInstalled() {
    try {
      localStorage.setItem(JOBFLOW_EXTENSION_INSTALLED_KEY, '1')
      localStorage.setItem(JOBFLOW_EXTENSION_INSTALLED_AT_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
  }

  function clearStaleInstalled() {
    try {
      localStorage.removeItem(JOBFLOW_EXTENSION_INSTALLED_KEY)
      localStorage.removeItem(JOBFLOW_EXTENSION_INSTALLED_AT_KEY)
    } catch {
      /* ignore */
    }
  }

  /** Sync from live content-script signal only. */
  function refresh() {
    if (!import.meta.client) return
    const live = isExtensionLiveInBrowser()
    installed.value = live
    if (live) persistLiveInstalled()
    else clearStaleInstalled()
    readDismissed()
    checking.value = false
  }

  const showBanner = computed(() => !checking.value && !installed.value && !dismissed.value)

  function dismissBanner() {
    dismissed.value = true
    try {
      localStorage.setItem(JOBFLOW_EXTENSION_DISMISSED_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  function onInstalledEvent() {
    installed.value = true
    persistLiveInstalled()
    checking.value = false
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') refresh()
  }

  onMounted(() => {
    refresh()
    // Content script is document_start; brief retries cover late inject / SPA navigations
    retryTimers = [50, 300].map((ms) => window.setTimeout(refresh, ms))
    window.addEventListener('jobflow-extension-installed', onInstalledEvent)
    document.addEventListener('visibilitychange', onVisibility)
  })

  onBeforeUnmount(() => {
    if (!import.meta.client) return
    for (const id of retryTimers) window.clearTimeout(id)
    window.removeEventListener('jobflow-extension-installed', onInstalledEvent)
    document.removeEventListener('visibilitychange', onVisibility)
  })

  return {
    installed,
    dismissed,
    checking,
    showBanner,
    dismissBanner,
    refresh,
  }
}
