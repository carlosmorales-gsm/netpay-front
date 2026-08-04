export type Terminal = {
  id: number
  usuarioId: number
  nombreUsuario: string
  companyId: number
  storeId: string
  folioTerminal: string
  fechaAsignacion: string
  activo: boolean
}

export type TerminalPayload = {
  usuarioId: number
  nombreUsuario: string
  companyId: number
  storeId: string
  folioTerminal: string
  activo: boolean
}

export type TerminalUserOption = {
  usuarioId: number
  nombreUsuario: string
}

export type TerminalFilters = {
  companyId: string
  usuarioId: string
  nombreUsuario: string
  activo: string
}

export type TerminalForm = {
  usuarioId: string | number
  nombreUsuario: string
  companyId: string | number
  storeId: string
  folioTerminal: string
  activo: boolean
}
