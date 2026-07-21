export type ToastKind = 'success' | 'error' | 'info'

export interface AppToastAction {
  label: string
  onClick: () => void
}

export interface AppToast {
  id: number
  kind: ToastKind
  message: string
  action?: AppToastAction
}

export type ToastOptions = {
  ttlMs?: number
  action?: AppToastAction
}

let nextId = 1

/**
 * Lightweight shared toast store for builder pages (no browser alerts).
 */
export function useAppToast() {
  const toasts = useState<AppToast[]>('app-toasts', () => [])

  function pushToast(message: string, kind: ToastKind = 'info', options?: ToastOptions | number) {
    const opts: ToastOptions =
      typeof options === 'number' ? { ttlMs: options } : options || {}
    const ttlMs = opts.ttlMs ?? (opts.action ? 8000 : kind === 'error' ? 4500 : 3200)
    const id = nextId++
    toasts.value = [
      ...toasts.value,
      { id, kind, message, ...(opts.action ? { action: opts.action } : {}) },
    ]
    if (import.meta.client) {
      window.setTimeout(() => {
        toasts.value = toasts.value.filter((t) => t.id !== id)
      }, ttlMs)
    }
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    pushToast,
    dismissToast,
    success: (message: string, options?: ToastOptions) => pushToast(message, 'success', options),
    error: (message: string, options?: ToastOptions) =>
      pushToast(message, 'error', { ttlMs: 4500, ...options }),
    info: (message: string, options?: ToastOptions) => pushToast(message, 'info', options),
  }
}
