export type AppConfirmState = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  danger: boolean
  resolve: ((value: boolean) => void) | null
}

/**
 * Themed confirm dialog (replaces window.confirm).
 */
export function useAppConfirm() {
  const state = useState<AppConfirmState>('app-confirm', () => ({
    open: false,
    title: 'Confirm',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    danger: false,
    resolve: null,
  }))

  function confirm(options: {
    title?: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
  }): Promise<boolean> {
    return new Promise((resolve) => {
      state.value = {
        open: true,
        title: options.title || 'Confirm',
        message: options.message,
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        danger: options.danger ?? false,
        resolve,
      }
    })
  }

  function close(result: boolean) {
    const resolver = state.value.resolve
    state.value = {
      ...state.value,
      open: false,
      resolve: null,
    }
    resolver?.(result)
  }

  return {
    state,
    confirm,
    accept: () => close(true),
    cancel: () => close(false),
  }
}
