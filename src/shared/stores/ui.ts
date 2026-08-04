import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastItem = {
  id: number
  tone: ToastTone
  message: string
}

type ConfirmOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

type ConfirmState = ConfirmOptions & {
  open: boolean
  resolve: ((value: boolean) => void) | null
}

let toastSeq = 1

export const useUiStore = defineStore('ui', () => {
  const loadingCount = ref(0)
  const toasts = ref<ToastItem[]>([])
  const confirmState = ref<ConfirmState>({
    open: false,
    message: '',
    title: 'Confirmar',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    danger: false,
    resolve: null,
  })

  const isLoading = computed(() => loadingCount.value > 0)

  function startLoading() {
    loadingCount.value += 1
  }

  function stopLoading() {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }

  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    startLoading()
    try {
      return await fn()
    } finally {
      stopLoading()
    }
  }

  function pushToast(tone: ToastTone, message: string, ms = 4200) {
    const id = toastSeq++
    toasts.value.push({ id, tone, message })
    window.setTimeout(() => dismissToast(id), ms)
  }

  function success(message: string) {
    pushToast('success', message)
  }

  function error(message: string) {
    pushToast('error', message)
  }

  function info(message: string) {
    pushToast('info', message)
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function confirm(options: ConfirmOptions): Promise<boolean> {
    if (confirmState.value.open && confirmState.value.resolve) {
      confirmState.value.resolve(false)
    }
    return new Promise((resolve) => {
      confirmState.value = {
        open: true,
        title: options.title ?? 'Confirmar',
        message: options.message,
        confirmText: options.confirmText ?? 'Confirmar',
        cancelText: options.cancelText ?? 'Cancelar',
        danger: options.danger ?? false,
        resolve,
      }
    })
  }

  function resolveConfirm(value: boolean) {
    const current = confirmState.value
    current.open = false
    current.resolve?.(value)
    current.resolve = null
  }

  return {
    isLoading,
    toasts,
    confirmState,
    startLoading,
    stopLoading,
    withLoading,
    success,
    error,
    info,
    dismissToast,
    confirm,
    resolveConfirm,
  }
})
