export const SYSTEM_ADMIN_ROLE_NAME = 'Administrador'

export function isSystemAdminRole(nombre?: string | null) {
  return (nombre ?? '').trim().toLowerCase() === 'administrador'
}

export function isProtectedAdmin(item: { protegido?: boolean; roleNombre?: string | null; nombre?: string | null }) {
  if (item.protegido === true) return true
  return isSystemAdminRole(item.roleNombre) || isSystemAdminRole(item.nombre)
}
