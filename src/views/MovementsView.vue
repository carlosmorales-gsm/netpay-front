<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { http } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

type Movement = {
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

type MovementsResponse = {
  items: Movement[]
  total: number
  totalImporte: number
}

type Empresa = {
  id: number
  nombre: string
}

const auth = useAuthStore()
const scope = ref<'own' | 'global'>('own')
const loading = ref(false)
const error = ref<string | null>(null)
const data = ref<MovementsResponse>({ items: [], total: 0, totalImporte: 0 })
const empresas = ref<Empresa[]>([])

const filters = reactive({
  usuarioId: '',
  companyId: '',
  from: '',
  to: '',
})

const canGlobal = computed(() => auth.hasPermission('movements.global'))

async function load() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, string> = { scope: scope.value }
    if (scope.value === 'global' && filters.usuarioId) params.usuarioId = filters.usuarioId
    if (filters.companyId) params.companyId = filters.companyId
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    const res = await http.get<MovementsResponse>('/admin/movements', { params })
    data.value = res.data
  } catch {
    error.value = 'No se pudieron cargar los movimientos'
  } finally {
    loading.value = false
  }
}

function setScope(next: 'own' | 'global') {
  scope.value = next
  load()
}

function money(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0)
}

function empresaNombre(id: number | null) {
  if (id == null) return '—'
  return empresas.value.find((e) => e.id === id)?.nombre ?? String(id)
}

async function loadEmpresas() {
  try {
    const { data: list } = await http.get<Empresa[]>('/admin/empresas')
    empresas.value = list
  } catch {
    empresas.value = []
  }
}

onMounted(async () => {
  await loadEmpresas()
  await load()
})
</script>

<template>
  <section>
    <div class="page-header">
      <div>
        <h1>Movimientos</h1>
        <p>Ingresos y transacciones registradas</p>
      </div>
      <div class="stat-chip">
        <span>{{ data.total }} registros</span>
        <strong>{{ money(data.totalImporte) }}</strong>
      </div>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: scope === 'own' }" type="button" @click="setScope('own')">
        Mis movimientos
      </button>
      <button
        v-if="canGlobal"
        class="tab"
        :class="{ active: scope === 'global' }"
        type="button"
        @click="setScope('global')"
      >
        Globales
      </button>
    </div>

    <div class="card toolbar">
      <div v-if="scope === 'global'" class="field">
        <label>Usuario Odoo</label>
        <input v-model="filters.usuarioId" type="number" />
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
        <label>Desde</label>
        <input v-model="filters.from" type="date" />
      </div>
      <div class="field">
        <label>Hasta</label>
        <input v-model="filters.to" type="date" />
      </div>
      <button class="btn btn-primary" type="button" @click="load">Filtrar</button>
    </div>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <p v-if="scope === 'own' && auth.user?.odooUserId == null" class="error-text">
      Su usuario no tiene odooUserId; no se pueden mostrar movimientos propios.
    </p>

    <div class="card table-wrap">
      <div v-if="loading" class="loading-row">
        <span class="spinner" />
        Cargando movimientos…
      </div>
      <div v-else-if="!data.items.length" class="empty-state">
        <strong>Sin movimientos</strong>
        No hay transacciones para los filtros seleccionados.
      </div>
      <table v-else class="data">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Folio</th>
            <th>Order</th>
            <th>Usuario</th>
            <th>Empresa</th>
            <th>Importe</th>
            <th>Resp.</th>
            <th>Aplicado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.items" :key="row.id">
            <td>{{ new Date(row.fechaTransacciones).toLocaleString('es-MX') }}</td>
            <td>{{ row.tipoTransaccionDesc || '—' }}</td>
            <td>{{ row.folioVenta }}</td>
            <td>{{ row.orderId || '—' }}</td>
            <td>{{ row.usuarioId }}</td>
            <td>{{ empresaNombre(row.companyId) }}</td>
            <td>{{ money(row.importe) }}</td>
            <td>{{ row.tipoRespuesta || '—' }}</td>
            <td>
              <span class="badge" :class="row.aplicado ? 'badge-ok' : 'badge-off'">
                {{ row.aplicado ? 'Sí' : 'No' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

