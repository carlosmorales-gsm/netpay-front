export type Movement = {
  id: number
  usuarioId: number
  importe: number
  fechaTransacciones: string
  tipoRespuesta: string | null
  tarjeta: string | null
  folioVenta: string
  orderId: string | null
  tipoTransaccionDesc: string | null
  aplicado: boolean
  storeId: string | null
  companyId: number | null
}

export type MovementsResponse = {
  items: Movement[]
  total: number
  totalImporte: number
}

export type MovementFilters = {
  usuarioId: string
  companyId: string
  from: string
  to: string
}

export type MovementScope = 'own' | 'global'
