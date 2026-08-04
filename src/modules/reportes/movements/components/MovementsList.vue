<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { useEmpresasStore } from '@/shared/stores/empresas'
import { useMovementsStore } from '../stores/movements'

const auth = useAuthStore()
const store = useMovementsStore()
const empresas = useEmpresasStore()
const { scope, loading, error, data, filters } = storeToRefs(store)
</script>

<template>
  <div>
    <div class="card toolbar">
      <div v-if="scope === 'global'" class="field">
        <label>Usuario Odoo</label>
        <input v-model="filters.usuarioId" type="number" />
      </div>
      <div class="field">
        <label>Empresa</label>
        <select v-model="filters.companyId">
          <option value="">Todas</option>
          <option v-for="e in empresas.items" :key="e.id" :value="String(e.id)">
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
      <button class="btn btn-primary" type="button" @click="store.fetchList()">Filtrar</button>
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
            <td>{{ empresas.nombre(row.companyId) }}</td>
            <td>{{ store.money(row.importe) }}</td>
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
  </div>
</template>
