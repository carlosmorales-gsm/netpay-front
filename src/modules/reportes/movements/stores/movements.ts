import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { useEmpresasStore } from '@/shared/stores/empresas'
import { useUiStore } from '@/shared/stores/ui'
import { getApiErrorMessage } from '@/shared/utils/apiError'
import { downloadTableExcel } from '@/shared/utils/exportExcel'
import { downloadTablePdf } from '@/shared/utils/exportPdf'
import { browserUtcOffsetLabel, formatLocalDateTime } from '@/shared/utils/formatDate'
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

  function clearFilters() {
    filters.usuarioId = ''
    filters.companyId = ''
    filters.tipoTransaccion = ''
    filters.from = ''
    filters.to = ''
    void fetchList()
  }

  function hasActiveFilters() {
    return Boolean(
      filters.usuarioId ||
        filters.companyId ||
        filters.tipoTransaccion ||
        filters.from ||
        filters.to,
    )
  }

  function exportMeta() {
    const empresas = useEmpresasStore()
    const userLabel = filters.usuarioId
      ? userOptions.value.find((u) => String(u.usuarioId) === filters.usuarioId)?.nombreUsuario ||
        filters.usuarioId
      : 'Todos'
    const stamp = new Date().toISOString().slice(0, 10)
    return {
      title: 'Movimientos NetPay',
      subtitle: `Usuario: ${userLabel} · Aplicado: ${money(data.value.totalImporteAplicado)} · Registros: ${data.value.total} · Horario ${browserUtcOffsetLabel()}`,
      filenameBase: `movimientos-${stamp}`,
      columns: [
        { header: 'Fecha', key: 'fecha', width: 20 },
        { header: 'Tipo', key: 'tipo', width: 16 },
        { header: 'Folio', key: 'folio', width: 14 },
        { header: 'Order', key: 'orderId', width: 28 },
        { header: 'Usuario', key: 'usuario', width: 22 },
        { header: 'Terminal', key: 'terminal', width: 16 },
        { header: 'Empresa', key: 'empresa', width: 28 },
        { header: 'Importe', key: 'importe', width: 14 },
        { header: 'Estatus', key: 'estatus', width: 18 },
      ],
      rows: data.value.items.map((row) => ({
        fecha: formatLocalDateTime(row.fechaTransacciones),
        tipo: row.tipoTransaccionDesc || '—',
        folio: row.folioVenta,
        orderId: row.orderId || '—',
        usuario: row.usuarioNombre || `ID ${row.usuarioId}`,
        terminal: row.folioTerminal || row.storeId || '—',
        empresa: empresas.nombre(row.companyId),
        importe: Number(row.importe) || 0,
        estatus: row.estatus?.label || (row.aplicado ? 'Aplicado' : row.tipoRespuesta || '—'),
      })),
    }
  }

  function exportPdf() {
    if (!data.value.items.length) return
    const { title, subtitle, filenameBase, columns, rows } = exportMeta()
    downloadTablePdf({
      title,
      subtitle,
      filename: `${filenameBase}.pdf`,
      columns,
      rows: rows.map((row) => ({ ...row, importe: money(Number(row.importe)) })),
    })
  }

  function exportExcel() {
    if (!data.value.items.length) return
    const { title, subtitle, filenameBase, columns, rows } = exportMeta()
    downloadTableExcel({
      title,
      subtitle,
      filename: `${filenameBase}.xlsx`,
      sheetName: 'Movimientos',
      columns: columns.map((c) => (c.key === 'importe' ? { ...c, type: 'number' as const } : c)),
      rows,
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
    exportExcel,
    clearFilters,
    hasActiveFilters,
  }
})
