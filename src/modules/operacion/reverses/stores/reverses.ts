import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { useEmpresasStore } from '@/shared/stores/empresas'
import { useUiStore } from '@/shared/stores/ui'
import { getApiErrorMessage } from '@/shared/utils/apiError'
import { reversesApi } from '../api/reverses.api'
import type { ReverseCase, ReverseFilters, ReverseUserOption, ReversesResponse } from '../types'

const emptyData = (): ReversesResponse => ({
  items: [],
  total: 0,
  totalPosible: 0,
  totalPendiente: 0,
  totalReversado: 0,
})

export const useReversesStore = defineStore('reverses', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<ReversesResponse>(emptyData())
  const userOptions = ref<ReverseUserOption[]>([])
  const consultingId = ref<number | null>(null)

  const filters = reactive<ReverseFilters>({
    usuarioId: '',
    companyId: '',
    estatus: '',
    from: '',
    to: '',
  })

  function listParams() {
    const params: Record<string, string> = {}
    if (filters.usuarioId) params.usuarioId = filters.usuarioId
    if (filters.companyId) params.companyId = filters.companyId
    if (filters.estatus) params.estatus = filters.estatus
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    return params
  }

  async function fetchUsers() {
    try {
      const res = await reversesApi.users()
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
        const res = await reversesApi.list(listParams())
        data.value = { ...emptyData(), ...res.data }
      })
    } catch (err) {
      error.value = getApiErrorMessage(err, 'No se pudieron cargar los reversos')
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
        const res = await reversesApi.list(listParams())
        data.value = { ...emptyData(), ...res.data }
      })
    } catch (err) {
      error.value = getApiErrorMessage(err, 'No se pudieron cargar los reversos')
      ui.error(error.value)
    } finally {
      loading.value = false
    }
  }

  function money(value: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0)
  }

  function canConsult(row: ReverseCase) {
    return Boolean(row.folioNumber)
  }

  async function consultFolio(row: ReverseCase) {
    const ui = useUiStore()
    if (!canConsult(row)) return

    const ok = await ui.confirm({
      title: 'Consultar por folio',
      message:
        'Se consultará el folioNumber en la terminal NetPay (reimpresión Smart Accounts). ' +
        'La terminal debe estar encendida y en pantalla principal. El estatus se actualizará con RV o PRV.',
      details: [
        { label: 'Folio de venta', value: row.folioVenta },
        { label: 'folioNumber', value: row.folioNumber || '—' },
        { label: 'Order', value: row.orderId || '—' },
        { label: 'Importe', value: money(row.importe) },
        { label: 'Estatus actual', value: row.estatus?.label || '—' },
      ],
      hint: 'El reverso lo hace la Pax. Esta consulta solo confirma RV o PRV; no cobra ni aplica pago.',
      confirmText: 'Consultar',
      cancelText: 'Cancelar',
    })
    if (!ok) return

    consultingId.value = row.id
    try {
      await ui.withLoading(async () => {
        const res = await reversesApi.consult(row.id)
        await fetchList()
        const updated = data.value.items.find((item) => item.id === row.id)
        const module = String(res.data?.reprintModule || '').toUpperCase()
        const key = updated?.estatus?.key
        if (module === 'PRV' || key === 'pending_reverse') {
          ui.info(
            'Pendiente de reverso (PRV). Hay que hacer otra venta el mismo día, aunque sea de $0.01, y volver a consultar este folio.',
          )
        } else if (module === 'RV' || key === 'reversed') {
          ui.success('Reversada (RV). No se debe cobrar.')
        } else if (res.data?.status === 'timeout') {
          ui.info(
            'Consulta enviada. Si el estatus no cambia, espera a que la terminal termine y recarga el listado.',
          )
        } else {
          ui.success(res.data?.message || 'Consulta enviada a la terminal')
        }
      })
    } catch (err) {
      ui.error(getApiErrorMessage(err, 'No se pudo consultar el folio'))
    } finally {
      consultingId.value = null
    }
  }

  function clearFilters() {
    filters.usuarioId = ''
    filters.companyId = ''
    filters.estatus = ''
    filters.from = ''
    filters.to = ''
    void fetchList()
  }

  function hasActiveFilters() {
    return Boolean(
      filters.usuarioId || filters.companyId || filters.estatus || filters.from || filters.to,
    )
  }

  return {
    loading,
    error,
    data,
    filters,
    userOptions,
    consultingId,
    init,
    fetchList,
    money,
    canConsult,
    consultFolio,
    clearFilters,
    hasActiveFilters,
  }
})
