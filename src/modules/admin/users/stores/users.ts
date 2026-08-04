import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { getApiErrorMessage } from '@/shared/utils/apiError'
import { useUiStore } from '@/shared/stores/ui'
import { downloadTablePdf } from '@/shared/utils/exportPdf'
import type { OdooUserLookup } from '@/shared/types/odooUser'
import { usersApi } from '../api/users.api'
import type { RoleOption, User, UserForm } from '../types'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const roles = ref<RoleOption[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const modalError = ref<string | null>(null)
  const showModal = ref(false)
  const editingId = ref<number | null>(null)
  const odooQuery = ref('')
  const odooResults = ref<OdooUserLookup[]>([])
  const odooSearching = ref(false)
  const odooError = ref<string | null>(null)

  const form = reactive<UserForm>({
    email: '',
    password: '',
    nombre: '',
    odooUserId: '',
    roleId: '',
    activo: true,
  })

  async function fetchList() {
    const auth = useAuthStore()
    const ui = useUiStore()
    loading.value = true
    error.value = null
    try {
      await ui.withLoading(async () => {
        const usersRes = await usersApi.list()
        users.value = usersRes.data
        try {
          const rolesRes = auth.hasPermission('roles.view')
            ? await usersApi.roles()
            : await usersApi.roleOptions()
          roles.value = rolesRes.data
        } catch {
          roles.value = []
        }
      })
    } catch {
      error.value = 'No se pudieron cargar los usuarios'
      ui.error(error.value)
    } finally {
      loading.value = false
    }
  }

  function clearOdooSearch() {
    odooQuery.value = ''
    odooResults.value = []
    odooError.value = null
    odooSearching.value = false
  }

  function openCreate() {
    editingId.value = null
    modalError.value = null
    error.value = null
    clearOdooSearch()
    form.email = ''
    form.password = ''
    form.nombre = ''
    form.odooUserId = ''
    form.roleId = roles.value[0]?.id ?? ''
    form.activo = true
    showModal.value = true
  }

  function openEdit(user: User) {
    editingId.value = user.id
    modalError.value = null
    error.value = null
    clearOdooSearch()
    form.email = user.email
    form.password = ''
    form.nombre = user.nombre
    form.odooUserId = user.odooUserId ?? ''
    form.roleId = user.roleId
    form.activo = user.activo
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    clearOdooSearch()
  }

  async function searchOdooUsers() {
    const term = odooQuery.value.trim()
    odooError.value = null
    odooResults.value = []
    if (term.length < 2) {
      odooError.value = 'Escribe al menos 2 caracteres (ej. claudia)'
      return
    }
    odooSearching.value = true
    try {
      const { data } = await usersApi.searchOdooUsers(term)
      odooResults.value = data
      if (!data.length) odooError.value = 'Sin resultados en Odoo'
    } catch (e: unknown) {
      odooError.value = getApiErrorMessage(e, 'No se pudo buscar en Odoo')
    } finally {
      odooSearching.value = false
    }
  }

  function selectOdooUser(user: OdooUserLookup) {
    form.odooUserId = user.id
    if (!form.nombre.trim() && user.nombre) form.nombre = user.nombre
    if (!form.email.trim() && user.correo) form.email = user.correo
    odooResults.value = []
    odooError.value = null
  }

  async function save() {
    const ui = useUiStore()
    modalError.value = null
    error.value = null

    const payload: Record<string, unknown> = {
      email: form.email.trim(),
      nombre: form.nombre.trim(),
      roleId: Number(form.roleId),
      activo: form.activo,
      odooUserId: form.odooUserId === '' ? null : Number(form.odooUserId),
    }
    if (form.password) payload.password = form.password

    saving.value = true
    try {
      await ui.withLoading(async () => {
        if (editingId.value) {
          await usersApi.update(editingId.value, payload)
        } else {
          if (!form.password) {
            modalError.value = 'La contraseña es requerida'
            throw new Error(modalError.value)
          }
          payload.password = form.password
          await usersApi.create(payload)
        }
      })
      showModal.value = false
      ui.success(editingId.value ? 'Usuario actualizado' : 'Usuario creado')
      await fetchList()
    } catch (e: unknown) {
      if (!modalError.value) {
        modalError.value = getApiErrorMessage(e, 'No se pudo guardar')
      }
      ui.error(modalError.value)
    } finally {
      saving.value = false
    }
  }

  async function deactivate(user: User) {
    const ui = useUiStore()
    const ok = await ui.confirm({
      title: 'Desactivar usuario',
      message: `¿Desactivar a ${user.nombre}?`,
      confirmText: 'Desactivar',
      danger: true,
    })
    if (!ok) return
    try {
      await ui.withLoading(async () => {
        await usersApi.deactivate(user.id)
        await fetchList()
      })
      ui.success('Usuario desactivado')
    } catch (e: unknown) {
      ui.error(getApiErrorMessage(e, 'No se pudo desactivar'))
    }
  }

  function exportPdf() {
    if (!users.value.length) return
    downloadTablePdf({
      title: 'Usuarios del panel',
      filename: `usuarios-${new Date().toISOString().slice(0, 10)}.pdf`,
      columns: [
        { header: 'Nombre', key: 'nombre' },
        { header: 'Email', key: 'email' },
        { header: 'Rol', key: 'rol' },
        { header: 'Odoo ID', key: 'odooUserId' },
        { header: 'Estado', key: 'estado' },
      ],
      rows: users.value.map((user) => ({
        nombre: user.nombre,
        email: user.email,
        rol: user.roleNombre || '—',
        odooUserId: user.odooUserId ?? '—',
        estado: user.activo ? 'Activo' : 'Inactivo',
      })),
    })
  }

  return {
    users,
    roles,
    loading,
    saving,
    error,
    modalError,
    showModal,
    editingId,
    form,
    odooQuery,
    odooResults,
    odooSearching,
    odooError,
    fetchList,
    openCreate,
    openEdit,
    closeModal,
    searchOdooUsers,
    selectOdooUser,
    save,
    deactivate,
    exportPdf,
  }
})
