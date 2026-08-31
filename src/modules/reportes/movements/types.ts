export type Movement = {
  id: number
  usuarioId: number
  usuarioNombre: string | null
  importe: number
  fechaTransacciones: string
  tipoRespuesta: string | null
  tarjeta: string | null
  folioVenta: string
  orderId: string | null
  tipoTransaccion: number | null
  tipoTransaccionDesc: string | null
  aplicado: boolean
  storeId: string | null
  folioTerminal: string | null
  companyId: number | null
  estatus?: {
    key: string
    label: string
  }
  detalle?: {
    resumen: string
    campos: Array<{ label: string; value: string }>
  }
}

export type MovementsResponse = {
  items: Movement[]
  total: number
  totalImporte: number
  /** Suma solo de ingresos pagados aplicados en Odoo */
  totalImporteAplicado: number
  totalAplicados: number
}

export type MovementFilters = {
  usuarioId: string
  companyId: string
  tipoTransaccion: string
  from: string
  to: string
}

export type MovementTypeOption = {
  id: number
  label: string
}

export type MovementUserOption = {
  usuarioId: number
  nombreUsuario: string
}
