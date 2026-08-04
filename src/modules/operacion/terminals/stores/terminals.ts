import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { getApiErrorMessage } from '@/shared/utils/apiError'
import { useEmpresasStore } from '@/shared/stores/empresas'
import { useUiStore } from '@/shared/stores/ui'
import { downloadTablePdf } from '@/shared/utils/exportPdf'
import type { OdooUserLookup } from '@/shared/types/odooUser'
import { terminalsApi } from '../api/terminals.api'
import type {
  Terminal,
  TerminalFilters,
  TerminalForm,
  TerminalPayload,
  TerminalUserOption,
} from '../types'

export const useTerminalsStore = defineStore('terminals', () => {
  const items = ref<Terminal[]>([])
  const userOptions = ref<TerminalUserOption[]>([])
  const usedCompanyIds = ref<number[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const modalError = ref<string | null>(null)
  const showModal = ref(false)
  const editingId = ref<number | null>(null)
  const showOdooModal = ref(false)
  const odooQuery = ref('')
  const odooResults = ref<OdooUserLookup[]>([])
  const odooSearching = ref(false)
  const odooError = ref<string | null>(null)
  const showUserSuggestions = ref(false)
  const testingId = ref<number | null>(null)
  const togglingId = ref<number | null>(null)

  const filters = reactive<TerminalFilters>({
    companyId: '',
    usuarioId: '',
    nombreUsuario: '',
    activo: '',
  })

  const form = reactive<TerminalForm>({
    usuarioId: '',
    nombreUsuario: '',
    companyId: '',
    storeId: '',
    folioTerminal: '',
    activo: true,
  })

  const filteredUserOptions = computed(() => {
    const q = filters.nombreUsuario.trim().toLowerCase()
    if (!q) return userOptions.value.slice(0, 12)
    return userOptions.value
      .filter((u) => u.nombreUsuario.toLowerCase().includes(q))
      .slice(0, 12)
  })

  const availableEmpresas = computed(() => {
    const empresas = useEmpresasStore()
    const current = Number(form.companyId)
    return empresas.items.filter((e) => {
      if (editingId.value && e.id === current) return true
      return !usedCompanyIds.value.includes(e.id)
    })
  })

  const userHasAllEmpresas = computed(() => {
    const empresas = useEmpresasStore()
    if (!form.usuarioId || !empresas.items.length) return false
    return availableEmpresas.value.length === 0
  })

  async function fetchUserOptions() {
    try {
      const { data } = await terminalsApi.userOptions()
      userOptions.value = data
    } catch {
      userOptions.value = []
    }
  }

  async function refreshUsedCompanies(usuarioId: number | string) {
    const id = Number(usuarioId)
    if (!id) {
      usedCompanyIds.value = []
      return
    }
    try {
      const { data } = await terminalsApi.list({
        usuarioId: String(id),
        activo: true,
      })
      usedCompanyIds.value = data
        .filter((row) => row.id !== editingId.value)
        .map((row) => row.companyId)
    } catch {
      usedCompanyIds.value = []
    }
  }

  function pickDefaultCompany() {
    const first = availableEmpresas.value[0]?.id
    form.companyId = first ?? ''
  }

  async function fetchList() {
    const ui = useUiStore()
    loading.value = true
    error.value = null
    try {
      await ui.withLoading(async () => {
        const params: Record<string, string | boolean> = {}
        if (filters.companyId) params.companyId = filters.companyId
        if (filters.usuarioId) params.usuarioId = filters.usuarioId
        else if (filters.nombreUsuario.trim()) params.nombreUsuario = filters.nombreUsuario.trim()
        if (filters.activo !== '') params.activo = filters.activo === 'true'
        const { data } = await terminalsApi.list(params)
        items.value = data
      })
    } catch {
      error.value = 'No se pudieron cargar las terminales'
      ui.error('No se pudieron cargar las terminales')
    } finally {
      loading.value = false
    }
  }

  async function init() {
    const empresas = useEmpresasStore()
    const ui = useUiStore()
    loading.value = true
    try {
      await ui.withLoading(async () => {
        await Promise.all([empresas.fetchAll(), fetchUserOptions(), fetchListWithoutOverlay()])
      })
    } finally {
      loading.value = false
    }
  }

  async function fetchListWithoutOverlay() {
    error.value = null
    try {
      const params: Record<string, string | boolean> = {}
      if (filters.companyId) params.companyId = filters.companyId
      if (filters.usuarioId) params.usuarioId = filters.usuarioId
      else if (filters.nombreUsuario.trim()) params.nombreUsuario = filters.nombreUsuario.trim()
      if (filters.activo !== '') params.activo = filters.activo === 'true'
      const { data } = await terminalsApi.list(params)
      items.value = data
    } catch {
      error.value = 'No se pudieron cargar las terminales'
      useUiStore().error('No se pudieron cargar las terminales')
    }
  }

  function onNombreUsuarioInput() {
    filters.usuarioId = ''
    showUserSuggestions.value = true
  }

  function selectUserFilter(option: TerminalUserOption) {
    filters.nombreUsuario = option.nombreUsuario
    filters.usuarioId = String(option.usuarioId)
    showUserSuggestions.value = false
    fetchList()
  }

  function clearUserFilter() {
    filters.nombreUsuario = ''
    filters.usuarioId = ''
    showUserSuggestions.value = false
  }

  function clearOdooSearch() {
    odooQuery.value = ''
    odooResults.value = []
    odooError.value = null
    odooSearching.value = false
  }

  function openOdooSearch() {
    clearOdooSearch()
    showOdooModal.value = true
  }

  function closeOdooSearch() {
    showOdooModal.value = false
    clearOdooSearch()
  }

  function openCreate() {
    editingId.value = null
    modalError.value = null
    error.value = null
    closeOdooSearch()
    usedCompanyIds.value = []
    form.usuarioId = ''
    form.nombreUsuario = ''
    form.companyId = ''
    form.storeId = ''
    form.folioTerminal = ''
    form.activo = true
    showModal.value = true
  }

  async function openEdit(row: Terminal) {
    modalError.value = null
    error.value = null
    closeOdooSearch()
    editingId.value = row.id
    form.usuarioId = row.usuarioId
    form.nombreUsuario = row.nombreUsuario
    form.companyId = row.companyId
    form.storeId = row.storeId
    form.folioTerminal = row.folioTerminal
    form.activo = row.activo
    showModal.value = true
    await refreshUsedCompanies(row.usuarioId)
  }

  function closeModal() {
    showModal.value = false
    closeOdooSearch()
    usedCompanyIds.value = []
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
      const { data } = await terminalsApi.searchOdooUsers(term)
      odooResults.value = data
      if (!data.length) odooError.value = 'Sin resultados en Odoo'
    } catch (e: unknown) {
      odooError.value = getApiErrorMessage(e, 'No se pudo buscar en Odoo')
    } finally {
      odooSearching.value = false
    }
  }

  async function selectOdooUser(user: OdooUserLookup) {
    const ui = useUiStore()
    form.usuarioId = user.id
    form.nombreUsuario = user.nombre || user.correo || String(user.id)
    modalError.value = null
    closeOdooSearch()
    await refreshUsedCompanies(user.id)

    if (userHasAllEmpresas.value) {
      form.companyId = ''
      modalError.value =
        'Este usuario ya tiene terminal activa en todas las empresas. No se puede dar de alta de nuevo.'
      ui.error(modalError.value)
      return
    }

    pickDefaultCompany()
  }

  async function save() {
    const ui = useUiStore()
    modalError.value = null
    error.value = null

    const usuarioId = Number(form.usuarioId)
    const companyId = Number(form.companyId)

    if (!usuarioId || usuarioId < 1 || !form.nombreUsuario.trim()) {
      modalError.value = 'Selecciona un usuario Odoo'
      return
    }
    if (userHasAllEmpresas.value && !editingId.value) {
      modalError.value =
        'Este usuario ya tiene terminal activa en todas las empresas. No se puede dar de alta de nuevo.'
      ui.error(modalError.value)
      return
    }
    if (!companyId || companyId < 1) {
      modalError.value = 'Selecciona una empresa disponible'
      return
    }
    if (
      !editingId.value &&
      usedCompanyIds.value.includes(companyId)
    ) {
      modalError.value = 'Ya existe una terminal activa para este usuario en esa empresa'
      ui.error(modalError.value)
      return
    }
    if (!form.storeId.trim() || !form.folioTerminal.trim()) {
      modalError.value = 'Store ID y Folio terminal son obligatorios'
      return
    }

    const payload: TerminalPayload = {
      usuarioId,
      nombreUsuario: form.nombreUsuario.trim(),
      companyId,
      storeId: form.storeId.trim(),
      folioTerminal: form.folioTerminal.trim(),
      activo: form.activo,
    }

    saving.value = true
    try {
      await ui.withLoading(async () => {
        if (editingId.value) {
          await terminalsApi.update(editingId.value, payload)
        } else {
          await terminalsApi.create(payload)
        }
      })
      showModal.value = false
      ui.success(editingId.value ? 'Terminal actualizada' : 'Terminal creada')
      await Promise.all([fetchListWithoutOverlay(), fetchUserOptions()])
    } catch (e: unknown) {
      modalError.value = getApiErrorMessage(e, 'No se pudo guardar')
      ui.error(modalError.value)
    } finally {
      saving.value = false
    }
  }

  async function toggleActivo(row: Terminal) {
    const ui = useUiStore()
    const next = !row.activo
    if (!next) {
      const ok = await ui.confirm({
        title: 'Desactivar terminal',
        message: `¿Desactivar la terminal de ${row.nombreUsuario}?`,
        confirmText: 'Desactivar',
        danger: true,
      })
      if (!ok) return
    }

    togglingId.value = row.id
    error.value = null
    try {
      await terminalsApi.update(row.id, { activo: next })
      row.activo = next
      ui.success(next ? 'Terminal activada' : 'Terminal desactivada')
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, 'No se pudo cambiar el estado')
      error.value = msg
      ui.error(msg)
    } finally {
      togglingId.value = null
    }
  }

  async function testCharge(row: Terminal) {
    const ui = useUiStore()
    if (!row.activo) {
      ui.error('Activa la terminal antes de enviar un cobro de prueba')
      return
    }
    const ok = await ui.confirm({
      title: 'Cobro de prueba',
      message: `¿Enviar cobro de prueba de $0.10 (10 centavos) a la terminal de ${row.nombreUsuario}?`,
      confirmText: 'Enviar cobro',
    })
    if (!ok) return

    testingId.value = row.id
    error.value = null
    try {
      await ui.withLoading(async () => {
        await terminalsApi.testCharge(row.id)
      })
      ui.success('Cobro de prueba ($0.10) enviado a la terminal')
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, 'No se pudo enviar el cobro de prueba')
      error.value = msg
      ui.error(msg)
    } finally {
      testingId.value = null
    }
  }

  function exportPdf() {
    if (!items.value.length) return
    const empresas = useEmpresasStore()
    downloadTablePdf({
      title: 'Terminales NetPay',
      filename: `terminales-${new Date().toISOString().slice(0, 10)}.pdf`,
      subtitle: `Registros visibles: ${items.value.length}`,
      columns: [
        { header: 'ID', key: 'id' },
        { header: 'Usuario', key: 'nombreUsuario' },
        { header: 'Odoo ID', key: 'usuarioId' },
        { header: 'Empresa', key: 'empresa' },
        { header: 'Store', key: 'storeId' },
        { header: 'Folio', key: 'folioTerminal' },
        { header: 'Estado', key: 'estado' },
      ],
      rows: items.value.map((row) => ({
        id: row.id,
        nombreUsuario: row.nombreUsuario,
        usuarioId: row.usuarioId,
        empresa: empresas.nombre(row.companyId),
        storeId: row.storeId,
        folioTerminal: row.folioTerminal,
        estado: row.activo ? 'Activo' : 'Inactivo',
      })),
    })
  }

  return {
    items,
    userOptions,
    filteredUserOptions,
    availableEmpresas,
    userHasAllEmpresas,
    loading,
    saving,
    error,
    modalError,
    showModal,
    showOdooModal,
    editingId,
    filters,
    form,
    odooQuery,
    odooResults,
    odooSearching,
    odooError,
    showUserSuggestions,
    testingId,
    togglingId,
    init,
    fetchList,
    onNombreUsuarioInput,
    selectUserFilter,
    clearUserFilter,
    openCreate,
    openEdit,
    closeModal,
    openOdooSearch,
    closeOdooSearch,
    searchOdooUsers,
    selectOdooUser,
    save,
    toggleActivo,
    testCharge,
    exportPdf,
  }
})
