import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { groupBySection } from '@/shared/config/menuSections'
import { getApiErrorMessage } from '@/shared/utils/apiError'
import { useUiStore } from '@/shared/stores/ui'
import { downloadTablePdf } from '@/shared/utils/exportPdf'
import { rolesApi } from '../api/roles.api'
import type { Permission, Role, RoleForm } from '../types'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const modalError = ref<string | null>(null)
  const showModal = ref(false)
  const editing = ref<Role | null>(null)

  const form = reactive<RoleForm>({
    nombre: '',
    descripcion: '',
    permissionIds: [],
  })

  const permissionSections = computed(() => groupBySection(permissions.value))

  async function fetchList() {
    const ui = useUiStore()
    loading.value = true
    error.value = null
    try {
      await ui.withLoading(async () => {
        const [rolesRes, permsRes] = await Promise.all([rolesApi.list(), rolesApi.permissions()])
        roles.value = rolesRes.data
        permissions.value = permsRes.data
      })
    } catch {
      error.value = 'No se pudieron cargar los roles'
      ui.error(error.value)
    } finally {
      loading.value = false
    }
  }

  function openCreate() {
    editing.value = null
    modalError.value = null
    form.nombre = ''
    form.descripcion = ''
    form.permissionIds = []
    showModal.value = true
  }

  function openEdit(role: Role) {
    editing.value = role
    modalError.value = null
    form.nombre = role.nombre
    form.descripcion = role.descripcion || ''
    form.permissionIds = role.permissions.map((p) => p.id)
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
  }

  function togglePermission(id: number) {
    if (form.permissionIds.includes(id)) {
      form.permissionIds = form.permissionIds.filter((p) => p !== id)
    } else {
      form.permissionIds.push(id)
    }
  }

  function isScreenFullySelected(items: Permission[]) {
    return items.length > 0 && items.every((p) => form.permissionIds.includes(p.id))
  }

  function isScreenPartiallySelected(items: Permission[]) {
    const selected = items.filter((p) => form.permissionIds.includes(p.id)).length
    return selected > 0 && selected < items.length
  }

  function toggleScreen(items: Permission[]) {
    const ids = items.map((p) => p.id)
    if (isScreenFullySelected(items)) {
      form.permissionIds = form.permissionIds.filter((id) => !ids.includes(id))
    } else {
      const set = new Set(form.permissionIds)
      ids.forEach((id) => set.add(id))
      form.permissionIds = [...set]
    }
  }

  function sectionItems(screens: { items: Permission[] }[]) {
    return screens.flatMap((s) => s.items)
  }

  function isSectionFullySelected(screens: { items: Permission[] }[]) {
    return isScreenFullySelected(sectionItems(screens))
  }

  function isSectionPartiallySelected(screens: { items: Permission[] }[]) {
    return isScreenPartiallySelected(sectionItems(screens))
  }

  function toggleSection(screens: { items: Permission[] }[]) {
    toggleScreen(sectionItems(screens))
  }

  function groupedRolePermissions(role: Role) {
    return groupBySection(role.permissions)
  }

  async function save() {
    const auth = useAuthStore()
    const ui = useUiStore()
    modalError.value = null
    error.value = null
    if (!form.nombre.trim()) {
      modalError.value = 'El nombre del rol es obligatorio'
      ui.error(modalError.value)
      return
    }

    saving.value = true
    try {
      await ui.withLoading(async () => {
        let roleId = editing.value?.id
        if (editing.value) {
          await rolesApi.update(editing.value.id, {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim(),
          })
        } else {
          const { data } = await rolesApi.create({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim(),
          })
          roleId = data.id
        }

        if (roleId != null && auth.hasPermission('roles.manage')) {
          await rolesApi.setPermissions(roleId, form.permissionIds)
        }
      })

      showModal.value = false
      ui.success(editing.value ? 'Rol actualizado' : 'Rol creado')
      await fetchList()
    } catch (e: unknown) {
      modalError.value = getApiErrorMessage(e, 'No se pudo guardar')
      ui.error(modalError.value)
    } finally {
      saving.value = false
    }
  }

  function exportPdf() {
    if (!roles.value.length) return
    downloadTablePdf({
      title: 'Roles y permisos',
      filename: `roles-${new Date().toISOString().slice(0, 10)}.pdf`,
      columns: [
        { header: 'Rol', key: 'nombre' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Secciones', key: 'secciones' },
        { header: 'Permisos', key: 'permisos' },
      ],
      rows: roles.value.map((role) => {
        const groups = groupBySection(role.permissions)
        return {
          nombre: role.nombre,
          descripcion: role.descripcion || '—',
          secciones: groups.map((g) => g.sectionLabel).join(', ') || '—',
          permisos: role.permissions.map((p) => p.codigo).join(', ') || '—',
        }
      }),
    })
  }

  return {
    roles,
    permissions,
    loading,
    saving,
    error,
    modalError,
    showModal,
    editing,
    form,
    permissionSections,
    fetchList,
    openCreate,
    openEdit,
    closeModal,
    togglePermission,
    isScreenFullySelected,
    isScreenPartiallySelected,
    toggleScreen,
    isSectionFullySelected,
    isSectionPartiallySelected,
    toggleSection,
    groupedRolePermissions,
    save,
    exportPdf,
  }
})
