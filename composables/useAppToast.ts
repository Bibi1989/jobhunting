export type ToastKind = 'success' | 'error' | 'info'

export interface AppToast {
  id: number
  kind: ToastKind
  message: string
}

let nextId = 1

/**
 * Lightweight shared toast store for builder pages (no browser alerts).
 */
export function useAppToast() {
  const toasts = useState<AppToast[]>('app-toasts', () => [])

  function pushToast(message: string, kind: ToastKind = 'info', ttlMs = 3200) {
    const id = nextId++
    toasts.value = [...toasts.value, { id, kind, message }]
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
    success: (message: string) => pushToast(message, 'success'),
    error: (message: string) => pushToast(message, 'error', 4500),
    info: (message: string) => pushToast(message, 'info'),
  }
}
