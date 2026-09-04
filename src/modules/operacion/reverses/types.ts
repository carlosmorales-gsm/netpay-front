export type ReverseCase = {
  id: number
  usuarioId: number
  usuarioNombre: string | null
  importe: number
  fechaTransacciones: string
  tipoRespuesta: string | null
  tarjeta: string | null
  folioVenta: string
  folioNumber: string | null
  orderId: string | null
  tipoTransaccion: number | null
  tipoTransaccionDesc: string | null
  aplicado: boolean
  storeId: string | null
  folioTerminal: string | null
  companyId: number | null
  empresaNombre?: string | null
  estatus?: {
    key: string
    label: string
  }
  detalle?: {
    resumen: string
    campos: Array<{ label: string; value: string }>
  }
  respuestaJson?: unknown
}

export type ReverseConsultResult = {
  success?: boolean
  status?: string
  message?: string
  reprintModule?: string
  transactionId?: number
}

export type ReversesResponse = {
  items: ReverseCase[]
  total: number
  totalPosible: number
  totalPendiente: number
  totalReversado: number
}

export type ReverseFilters = {
  usuarioId: string
  companyId: string
  estatus: string
  from: string
  to: string
}

export type ReverseUserOption = {
  usuarioId: number
  nombreUsuario: string
}

export const REVERSE_STATUS_OPTIONS = [
  { id: 'possible_reverse', label: 'Posible reverso' },
  { id: 'pending_reverse', label: 'Pendiente de reverso' },
  { id: 'reversed', label: 'Reversada' },
] as const
