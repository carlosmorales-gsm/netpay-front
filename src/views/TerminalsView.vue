<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { http } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

type Terminal = {
  id: number
  usuarioId: number
  nombreUsuario: string
  companyId: number
  storeId: string
  folioTerminal: string
  fechaAsignacion: string
  activo: boolean
}

type Empresa = {
  id: number
  nombre: string
  activo: boolean
}

const auth = useAuthStore()
const items = ref<Terminal[]>([])
const empresas = ref<Empresa[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const modalError = ref<string | null>(null)
const showModal = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)

const filters = reactive({
  companyId: '',
  usuarioId: '',
  activo: '',
})

const form = reactive({
  usuarioId: '' as string | number,
  nombreUsuario: '',
  companyId: '' as string | number,
  storeId: '',
  folioTerminal: '',
  activo: true,
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, string | boolean> = {}
    if (filters.companyId) params.companyId = filters.companyId
    if (filters.usuarioId) params.usuarioId = filters.usuarioId
    if (filters.activo !== '') params.activo = filters.activo === 'true'
    const { data } = await http.get<Terminal[]>('/admin/terminals', { params })
    items.value = data
  } catch {
    error.value = 'No se pudieron cargar las terminales'
  } finally {
    loading.value = false
  }
}

async function loadEmpresas() {
  try {
    const { data } = await http.get<Empresa[]>('/admin/empresas')
    empresas.value = data
  } catch {
    empresas.value = []
  }
}

function empresaNombre(id: number) {
  return empresas.value.find((e) => e.id === id)?.nombre ?? String(id)
}

function openCreate() {
  editingId.value = null
  modalError.value = null
  error.value = null
  form.usuarioId = ''
  form.nombreUsuario = ''
  form.companyId = empresas.value[0]?.id ?? ''
  form.storeId = ''
  form.folioTerminal = ''
  form.activo = true
  showModal.value = true
}

function openEdit(row: Terminal) {
  modalError.value = null
  error.value = null
  editingId.value = row.id
  form.usuarioId = row.usuarioId
  form.nombreUsuario = row.nombreUsuario
  form.companyId = row.companyId
  form.storeId = row.storeId
  form.folioTerminal = row.folioTerminal
  form.activo = row.activo
  showModal.value = true
}

async function save() {
  modalError.value = null
  error.value = null

  const usuarioId = Number(form.usuarioId)
  const companyId = Number(form.companyId)

  if (!usuarioId || usuarioId < 1) {
    modalError.value = 'Captura el ID de usuario Odoo'
    return
  }
  if (!form.nombreUsuario.trim()) {
    modalError.value = 'Captura el nombre del usuario de terminal'
    return
  }
  if (!companyId || companyId < 1) {
    modalError.value = 'Selecciona una empresa'
    return
  }
  if (!form.storeId.trim() || !form.folioTerminal.trim()) {
    modalError.value = 'Store ID y Folio terminal son obligatorios'
    return
  }

  const payload = {
    usuarioId,
    nombreUsuario: form.nombreUsuario.trim(),
    companyId,
    storeId: form.storeId.trim(),
    folioTerminal: form.folioTerminal.trim(),
    activo: form.activo,
  }

  saving.value = true
  try {
    if (editingId.value) {
      await http.patch(`/admin/terminals/${editingId.value}`, payload)
    } else {
      await http.post('/admin/terminals', payload)
    }
    showModal.value = false
    await load()
  } catch (e: unknown) {
    const msg =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
    modalError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo guardar'
  } finally {
    saving.value = false
  }
}

async function deactivate(row: Terminal) {
  if (!confirm(`¿Desactivar terminal de ${row.nombreUsuario}?`)) return
  await http.delete(`/admin/terminals/${row.id}`)
  await load()
}

onMounted(async () => {
  await Promise.all([loadEmpresas(), load()])
})
</script>

<template>
  <section>
    <div class="page-header">
      <div>
        <h1>Terminales</h1>
        <p>Asignación de terminales NetPay a usuarios Odoo por empresa</p>
      </div>
      <button
        v-if="auth.hasPermission('terminals.manage')"
        class="btn btn-gold"
        type="button"
        @click="openCreate"
      >
        Nueva terminal
      </button>
    </div>

    <div class="card toolbar">
      <div class="field">
        <label>Usuario Odoo ID</label>
        <input v-model="filters.usuarioId" type="number" placeholder="usuario_id" />
      </div>
      <div class="field">
        <label>Empresa</label>
        <select v-model="filters.companyId">
          <option value="">Todas</option>
          <option v-for="e in empresas" :key="e.id" :value="String(e.id)">
            {{ e.nombre }}
          </option>
        </select>
      </div>
      <div class="field">
        <label>Activo</label>
        <select v-model="filters.activo">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
      <button class="btn btn-primary" type="button" @click="load">Filtrar</button>
    </div>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>

    <div class="card table-wrap">
      <div v-if="loading" class="loading-row">
        <span class="spinner" />
        Cargando terminales…
      </div>
      <div v-else-if="!items.length" class="empty-state">
        <strong>Sin terminales</strong>
        Registra una asignación usuario Odoo + empresa + terminal.
      </div>
      <table v-else class="data">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario terminal</th>
            <th>Odoo ID</th>
            <th>Empresa</th>
            <th>Store</th>
            <th>Folio terminal</th>
            <th>Estado</th>
            <th v-if="auth.hasPermission('terminals.manage')">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.id">
            <td>{{ row.id }}</td>
            <td>{{ row.nombreUsuario }}</td>
            <td>{{ row.usuarioId }}</td>
            <td>{{ empresaNombre(row.companyId) }}</td>
            <td>{{ row.storeId }}</td>
            <td>{{ row.folioTerminal }}</td>
            <td>
              <span class="badge" :class="row.activo ? 'badge-ok' : 'badge-off'">
                {{ row.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td v-if="auth.hasPermission('terminals.manage')" class="actions">
              <button class="btn btn-ghost btn-sm" type="button" @click="openEdit(row)">Editar</button>
              <button
                v-if="row.activo"
                class="btn btn-danger btn-sm"
                type="button"
                @click="deactivate(row)"
              >
                Desactivar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editingId ? 'Editar terminal' : 'Nueva terminal' }}</h2>
        <p class="modal-help">
          Los usuarios de terminal son de Odoo; no son los usuarios del panel de administración.
        </p>

        <p v-if="modalError" class="error-text" role="alert">{{ modalError }}</p>

        <div class="field">
          <label>Usuario Odoo ID</label>
          <input v-model="form.usuarioId" type="number" min="1" required placeholder="Ej. 245" />
        </div>
        <div class="field">
          <label>Nombre usuario terminal</label>
          <input
            v-model="form.nombreUsuario"
            maxlength="100"
            required
            placeholder="Nombre del usuario en Odoo"
          />
        </div>
        <div class="field">
          <label>Empresa</label>
          <select v-model="form.companyId" required>
            <option disabled value="">Seleccione</option>
            <option v-for="e in empresas" :key="e.id" :value="e.id">
              {{ e.nombre }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Store ID</label>
          <input v-model="form.storeId" maxlength="10" required />
        </div>
        <div class="field">
          <label>Folio terminal</label>
          <input v-model="form.folioTerminal" maxlength="20" required />
        </div>
        <div class="field">
          <label>
            <input v-model="form.activo" type="checkbox" />
            Activo
          </label>
        </div>
        <div class="actions">
          <button class="btn btn-ghost" type="button" @click="showModal = false">Cancelar</button>
          <button class="btn btn-primary" type="button" :disabled="saving" @click="save">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.modal-help {
  margin: -0.35rem 0 1rem;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
