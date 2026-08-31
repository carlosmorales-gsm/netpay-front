export type RefundablePayment = {
  id: number
  usuarioId: number
  usuarioNombre: string | null
  importe: number
  fechaTransacciones: string
  tipoRespuesta: string | null
  folioVenta: string
  orderId: string | null
  pagoSistemaId: number | null
  tipoTransaccion: number | null
  tipoTransaccionDesc: string | null
  aplicado: boolean
  storeId: string | null
  folioTerminal: string | null
  companyId: number | null
  tarjeta: string | null
}

export type RefundsResponse = {
  items: RefundablePayment[]
  total: number
  cancelWindowOpen?: boolean
  cancelCutoffLabel?: string
  todayLabel?: string
  message?: string
}

export type RefundFilters = {
  usuarioId: string
  companyId: string
}

export type VoidResult = {
  success: boolean
  status: string
  message: string
  transactionId: number
  orderId?: string
}
