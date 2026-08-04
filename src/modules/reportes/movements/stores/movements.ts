import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { useEmpresasStore } from '@/shared/stores/empresas'
import { useUiStore } from '@/shared/stores/ui'
import { downloadTablePdf } from '@/shared/utils/exportPdf'
import { movementsApi } from '../api/movements.api'
import type { MovementFilters, MovementScope, MovementsResponse } from '../types'

export const useMovementsStore = defineStore('movements', () => {
  const scope = ref<MovementScope>('own')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<MovementsResponse>({ items: [], total: 0, totalImporte: 0 })

  const filters = reactive<MovementFilters>({
    usuarioId: '',
    companyId: '',
    from: '',
    to: '',
  })

  async function fetchList() {
    const ui = useUiStore()
    loading.value = true
    error.value = null
    try {
      await ui.withLoading(async () => {
        const params: Record<string, string> = { scope: scope.value }
        if (scope.value === 'global' && filters.usuarioId) params.usuarioId = filters.usuarioId
        if (filters.companyId) params.companyId = filters.companyId
        if (filters.from) params.from = filters.from
        if (filters.to) params.to = filters.to
        const res = await movementsApi.list(params)
        data.value = res.data
      })
    } catch {
      error.value = 'No se pudieron cargar los movimientos'
      ui.error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function init() {
    const empresas = useEmpresasStore()
    const ui = useUiStore()
    loading.value = true
    try {
      await ui.withLoading(async () => {
        await empresas.fetchAll()
        const params: Record<string, string> = { scope: scope.value }
        const res = await movementsApi.list(params)
        data.value = res.data
      })
    } catch {
      error.value = 'No se pudieron cargar los movimientos'
      ui.error(error.value)
    } finally {
      loading.value = false
    }
  }

  function setScope(next: MovementScope) {
    scope.value = next
    return fetchList()
  }

  function money(value: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0)
  }

  function exportPdf() {
    if (!data.value.items.length) return
    const empresas = useEmpresasStore()
    downloadTablePdf({
      title: 'Movimientos NetPay',
      filename: `movimientos-${scope.value}-${new Date().toISOString().slice(0, 10)}.pdf`,
      subtitle: `Alcance: ${scope.value === 'own' ? 'Mis movimientos' : 'Globales'} · Total: ${money(data.value.totalImporte)}`,
      columns: [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Tipo', key: 'tipo' },
        { header: 'Folio', key: 'folio' },
        { header: 'Order', key: 'orderId' },
        { header: 'Usuario', key: 'usuarioId' },
        { header: 'Empresa', key: 'empresa' },
        { header: 'Importe', key: 'importe' },
        { header: 'Resp.', key: 'respuesta' },
        { header: 'Aplicado', key: 'aplicado' },
      ],
      rows: data.value.items.map((row) => ({
        fecha: new Date(row.fechaTransacciones).toLocaleString('es-MX'),
        tipo: row.tipoTransaccionDesc || '—',
        folio: row.folioVenta,
        orderId: row.orderId || '—',
        usuarioId: row.usuarioId,
        empresa: empresas.nombre(row.companyId),
        importe: money(row.importe),
        respuesta: row.tipoRespuesta || '—',
        aplicado: row.aplicado ? 'Sí' : 'No',
      })),
    })
  }

  return {
    scope,
    loading,
    error,
    data,
    filters,
    init,
    fetchList,
    setScope,
    money,
    exportPdf,
  }
})
