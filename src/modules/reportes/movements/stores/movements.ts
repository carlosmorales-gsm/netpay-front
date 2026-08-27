import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { useEmpresasStore } from '@/shared/stores/empresas'
import { useUiStore } from '@/shared/stores/ui'
import { getApiErrorMessage } from '@/shared/utils/apiError'
import { downloadTablePdf } from '@/shared/utils/exportPdf'
import { movementsApi } from '../api/movements.api'
import type {
  Movement,
  MovementFilters,
  MovementTypeOption,
  MovementUserOption,
  MovementsResponse,
} from '../types'

const emptyData = (): MovementsResponse => ({
  items: [],
  total: 0,
  totalImporte: 0,
  totalImporteAplicado: 0,
  totalAplicados: 0,
})

/** Tipos alineados con api-netpay `tipoTranasaccion` / columna tipo_transaccion */
export const MOVEMENT_TYPE_OPTIONS: MovementTypeOption[] = [
  { id: 1, label: 'Generar cobro' },
  { id: 2, label: 'Cancelar cobro' },
  { id: 3, label: 'Reimprimir cobro' },
]

export const useMovementsStore = defineStore('movements', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<MovementsResponse>(emptyData())
  const userOptions = ref<MovementUserOption[]>([])
  const typeOptions = ref<MovementTypeOption[]>(MOVEMENT_TYPE_OPTIONS)
  const reprintingId = ref<number | null>(null)

  const filters = reactive<MovementFilters>({
    usuarioId: '',
    companyId: '',
    tipoTransaccion: '',
    from: '',
    to: '',
  })

  function listParams() {
    const params: Record<string, string> = { scope: 'global' }
    if (filters.usuarioId) params.usuarioId = filters.usuarioId
    if (filters.companyId) params.companyId = filters.companyId
    if (filters.tipoTransaccion) params.tipoTransaccion = filters.tipoTransaccion
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    return params
  }

  async function fetchUsers() {
    const res = await movementsApi.users()
    userOptions.value = res.data
  }

  async function fetchList() {
    const ui = useUiStore()
    loading.value = true
    error.value = null
    try {
      await ui.withLoading(async () => {
        const res = await movementsApi.list(listParams())
        data.value = { ...emptyData(), ...res.data }
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
    error.value = null
    try {
      await ui.withLoading(async () => {
        await Promise.all([empresas.fetchAll(), fetchUsers()])
        const res = await movementsApi.list(listParams())
        data.value = { ...emptyData(), ...res.data }
      })
    } catch {
      error.value = 'No se pudieron cargar los movimientos'
      ui.error(error.value)
    } finally {
      loading.value = false
    }
  }

  function money(value: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0)
  }

  function canReprint(row: Movement) {
    return (
      row.estatus?.key === 'applied' ||
      (row.aplicado &&
        row.tipoRespuesta === '00' &&
        row.tipoTransaccion === 1)
    )
  }

  async function reprintTicket(row: Movement) {
    const ui = useUiStore()
    if (!canReprint(row)) return

    const ok = await ui.confirm({
      title: 'Reimprimir ticket',
      message:
        `Se enviará la reimpresión a la terminal NetPay.\n` +
        `Folio: ${row.folioVenta}\n` +
        `Order: ${row.orderId || '—'}\n` +
        `Importe: ${money(row.importe)}\n\n` +
        'La terminal debe estar encendida y en pantalla principal. ¿Continuar?',
      confirmText: 'Reimprimir',
      cancelText: 'Cancelar',
    })
    if (!ok) return

    reprintingId.value = row.id
    try {
      await ui.withLoading(async () => {
        await movementsApi.reprint(row.id)
        ui.success('Reimpresión enviada a la terminal')
      })
    } catch (err) {
      ui.error(getApiErrorMessage(err, 'No se pudo reimprimir el ticket'))
    } finally {
      reprintingId.value = null
    }
  }

  function exportPdf() {
    if (!data.value.items.length) return
    const empresas = useEmpresasStore()
    const userLabel = filters.usuarioId
      ? userOptions.value.find((u) => String(u.usuarioId) === filters.usuarioId)?.nombreUsuario ||
        filters.usuarioId
      : 'Todos'
    downloadTablePdf({
      title: 'Movimientos NetPay',
      filename: `movimientos-${new Date().toISOString().slice(0, 10)}.pdf`,
      subtitle: `Usuario: ${userLabel} · Aplicado: ${money(data.value.totalImporteAplicado)} · Registros: ${data.value.total}`,
      columns: [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Tipo', key: 'tipo' },
        { header: 'Folio', key: 'folio' },
        { header: 'Order', key: 'orderId' },
        { header: 'Usuario', key: 'usuario' },
        { header: 'Empresa', key: 'empresa' },
        { header: 'Importe', key: 'importe' },
        { header: 'Estatus', key: 'estatus' },
      ],
      rows: data.value.items.map((row) => ({
        fecha: new Date(row.fechaTransacciones).toLocaleString('es-MX'),
        tipo: row.tipoTransaccionDesc || '—',
        folio: row.folioVenta,
        orderId: row.orderId || '—',
        usuario: row.usuarioNombre || `ID ${row.usuarioId}`,
        empresa: empresas.nombre(row.companyId),
        importe: money(row.importe),
        estatus: row.estatus?.label || (row.aplicado ? 'Aplicado' : row.tipoRespuesta || '—'),
      })),
    })
  }

  return {
    loading,
    error,
    data,
    filters,
    userOptions,
    typeOptions,
    reprintingId,
    init,
    fetchList,
    money,
    canReprint,
    reprintTicket,
    exportPdf,
  }
})
