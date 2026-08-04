import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { useEmpresasStore } from '@/shared/stores/empresas'
import { useUiStore } from '@/shared/stores/ui'
import { getApiErrorMessage } from '@/shared/utils/apiError'
import { movementsApi } from '@/modules/reportes/movements/api/movements.api'
import type { MovementUserOption } from '@/modules/reportes/movements/types'
import { refundsApi } from '../api/refunds.api'
import type { RefundFilters, RefundablePayment } from '../types'

export const useRefundsStore = defineStore('refunds', () => {
  const loading = ref(false)
  const voidingId = ref<number | null>(null)
  const error = ref<string | null>(null)
  const items = ref<RefundablePayment[]>([])
  const total = ref(0)
  const cancelWindowOpen = ref(true)
  const listMessage = ref<string | null>(null)
  const userOptions = ref<MovementUserOption[]>([])

  const filters = reactive<RefundFilters>({
    usuarioId: '',
    companyId: '',
    from: '',
    to: '',
  })

  function listParams() {
    const params: Record<string, string> = {}
    if (filters.usuarioId) params.usuarioId = filters.usuarioId
    if (filters.companyId) params.companyId = filters.companyId
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    return params
  }

  async function fetchUsers() {
    try {
      const res = await movementsApi.users()
      userOptions.value = res.data
    } catch {
      userOptions.value = []
    }
  }

  async function fetchList() {
    const ui = useUiStore()
    loading.value = true
    error.value = null
    try {
      await ui.withLoading(async () => {
        const res = await refundsApi.list(listParams())
        items.value = res.data.items
        total.value = res.data.total
        cancelWindowOpen.value = res.data.cancelWindowOpen !== false
        listMessage.value = res.data.message || null
      })
    } catch (err) {
      error.value = getApiErrorMessage(err, 'No se pudieron cargar las devoluciones')
      ui.error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function init() {
    const empresas = useEmpresasStore()
    const ui = useUiStore()
    loading.value = true
    error.value = null
    try {
      await ui.withLoading(async () => {
        await Promise.all([empresas.fetchAll(), fetchUsers()])
        const res = await refundsApi.list(listParams())
        items.value = res.data.items
        total.value = res.data.total
        cancelWindowOpen.value = res.data.cancelWindowOpen !== false
        listMessage.value = res.data.message || null
      })
    } catch (err) {
      error.value = getApiErrorMessage(err, 'No se pudieron cargar las devoluciones')
      ui.error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function voidPayment(row: RefundablePayment) {
    const ui = useUiStore()
    const ok = await ui.confirm({
      title: 'Devolver pago',
      message:
        `Se enviará la cancelación a la terminal NetPay (Smart Accounts) por ${money(row.importe)}.\n` +
        `Order: ${row.orderId || '—'}\n` +
        `Folio: ${row.folioVenta}\n\n` +
        'La cancelación debe ser el mismo día (antes de las 8:00 p.m. CDMX). ¿Continuar?',
      confirmText: 'Devolver (esperando terminal)',
      cancelText: 'Cancelar',
      danger: true,
    })
    if (!ok) return

    voidingId.value = row.id
    try {
      await ui.withLoading(async () => {
        const res = await refundsApi.voidPayment(row.id)
        if (!res.data.success) {
          throw new Error(res.data.message || 'La devolución no procedió')
        }
        ui.success(res.data.message || 'Devolución exitosa en terminal')
        await fetchList()
      })
    } catch (err) {
      ui.error(getApiErrorMessage(err, 'No se pudo completar la devolución'))
    } finally {
      voidingId.value = null
    }
  }

  function money(value: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0)
  }

  return {
    loading,
    voidingId,
    error,
    items,
    total,
    cancelWindowOpen,
    listMessage,
    filters,
    userOptions,
    init,
    fetchList,
    voidPayment,
    money,
  }
})
