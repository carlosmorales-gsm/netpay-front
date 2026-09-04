export type ScreenMeta = {
  key: string
  label: string
  sectionId: string
}

export type MenuSectionDef = {
  id: string
  label: string
  order: number
}

/** Secciones del menú / permisos — fuente única para layout y roles */
export const MENU_SECTIONS: MenuSectionDef[] = [
  { id: 'operacion', label: 'Operación', order: 1 },
  { id: 'reportes', label: 'Reportes', order: 2 },
  { id: 'admin', label: 'Administración', order: 3 },
]

export const SCREENS: ScreenMeta[] = [
  { key: 'terminals', label: 'Terminales', sectionId: 'operacion' },
  { key: 'refunds', label: 'Devoluciones', sectionId: 'operacion' },
  { key: 'reverses', label: 'Reversos', sectionId: 'operacion' },
  { key: 'movements', label: 'Movimientos', sectionId: 'reportes' },
  { key: 'users', label: 'Usuarios', sectionId: 'admin' },
  { key: 'roles', label: 'Roles', sectionId: 'admin' },
]

export function sectionLabel(sectionId: string) {
  return MENU_SECTIONS.find((s) => s.id === sectionId)?.label ?? sectionId
}

export function screenMeta(pantalla: string): ScreenMeta {
  const known = SCREENS.find((s) => s.key === pantalla)
  if (known) return known
  return {
    key: pantalla,
    label: pantalla.charAt(0).toUpperCase() + pantalla.slice(1),
    sectionId: 'otros',
  }
}

export function groupBySection<T extends { pantalla: string }>(items: T[]) {
  const buckets = new Map<
    string,
    { sectionId: string; sectionLabel: string; screens: Map<string, { screenLabel: string; items: T[] }> }
  >()

  for (const item of items) {
    const screen = screenMeta(item.pantalla)
    const sectionId = screen.sectionId
    const sectionDef = MENU_SECTIONS.find((s) => s.id === sectionId)
    const sLabel = sectionDef?.label ?? 'Otros'

    if (!buckets.has(sectionId)) {
      buckets.set(sectionId, {
        sectionId,
        sectionLabel: sLabel,
        screens: new Map(),
      })
    }

    const section = buckets.get(sectionId)!
    if (!section.screens.has(screen.key)) {
      section.screens.set(screen.key, { screenLabel: screen.label, items: [] })
    }
    section.screens.get(screen.key)!.items.push(item)
  }

  return [...buckets.values()]
    .sort((a, b) => {
      const ao = MENU_SECTIONS.find((s) => s.id === a.sectionId)?.order ?? 99
      const bo = MENU_SECTIONS.find((s) => s.id === b.sectionId)?.order ?? 99
      return ao - bo
    })
    .map((section) => ({
      sectionId: section.sectionId,
      sectionLabel: section.sectionLabel,
      screens: [...section.screens.values()],
    }))
}
