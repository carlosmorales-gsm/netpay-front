<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { useEmpresasStore } from '@/shared/stores/empresas'
import { formatLocalDateTime } from '@/shared/utils/formatDate'
import { useRefundsStore } from '../stores/refunds'

const auth = useAuthStore()
const store = useRefundsStore()
const empresas = useEmpresasStore()
const { loading, voidingId, error, items, filters, userOptions, cancelWindowOpen, listMessage } =
  storeToRefs(store)

const canManage = () => auth.hasPermission('refunds.manage')
</script>

<template>
  <div class="refunds-list">
    <div class="card toolbar toolbar-relaxed">
      <div class="field field-user">
        <label>Usuario</label>
        <select v-model="filters.usuarioId">
          <option value="">Todos</option>
          <option v-for="u in userOptions" :key="u.usuarioId" :value="String(u.usuarioId)">
            {{ u.nombreUsuario }}
          </option>
        </select>
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
      <button class="btn btn-primary" type="button" @click="store.fetchList()">
        Filtrar
      </button>
    </div>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>

    <div class="card table-wrap">
      <div v-if="loading" class="loading-row">
        <span class="spinner" />
        Cargando pagos cancelables…
      </div>
      <div v-else-if="!items.length" class="empty-state">
        <strong>{{ cancelWindowOpen ? 'Sin pagos cancelables' : 'Fuera de horario' }}</strong>
        {{
          cancelWindowOpen
            ? 'No hay cobros del día de hoy que se puedan cancelar.'
            : 'Solo se podrán cancelar los cobros realizados el día de hoy, hasta las 20:00 horas (hora de Ciudad de México).'
        }}
      </div>
      <template v-else>
        <table class="data">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Folio</th>
              <th>Order</th>
              <th>Usuario</th>
              <th>Terminal</th>
              <th>Empresa</th>
              <th>Importe</th>
              <th>Tarjeta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in items" :key="row.id">
              <td>{{ formatLocalDateTime(row.fechaTransacciones) }}</td>
              <td>{{ row.folioVenta }}</td>
              <td>{{ row.orderId || '—' }}</td>
              <td>{{ row.usuarioNombre || `ID ${row.usuarioId}` }}</td>
              <td>{{ row.folioTerminal || row.storeId || '—' }}</td>
              <td>{{ empresas.nombre(row.companyId) }}</td>
              <td>{{ store.money(row.importe) }}</td>
              <td>{{ row.tarjeta || '—' }}</td>
              <td class="actions">
                <button
                  v-if="canManage()"
                  class="btn btn-ghost btn-danger-text"
                  type="button"
                  :disabled="voidingId === row.id || !row.orderId"
                  @click="store.voidPayment(row)"
                >
                  {{ voidingId === row.id ? 'Esperando terminal…' : 'Devolver' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="data-cards">
          <article v-for="row in items" :key="`card-${row.id}`" class="data-card">
            <div class="data-card-head">
              <strong>{{ store.money(row.importe) }}</strong>
              <span class="badge badge-ok">{{ row.folioVenta }}</span>
            </div>
            <div class="data-card-meta">
              <div class="row">
                <span>Fecha</span>
                <b>{{ formatLocalDateTime(row.fechaTransacciones) }}</b>
              </div>
              <div class="row">
                <span>Order</span>
                <b>{{ row.orderId || '—' }}</b>
              </div>
              <div class="row">
                <span>Usuario</span>
                <b>{{ row.usuarioNombre || `ID ${row.usuarioId}` }}</b>
              </div>
              <div class="row">
                <span>Terminal</span>
                <b>{{ row.folioTerminal || row.storeId || '—' }}</b>
              </div>
              <div class="row">
                <span>Empresa</span>
                <b>{{ empresas.nombre(row.companyId) }}</b>
              </div>
              <div class="row">
                <span>Tarjeta</span>
                <b>{{ row.tarjeta || '—' }}</b>
              </div>
            </div>
            <div v-if="canManage()" class="actions">
              <button
                class="btn btn-ghost btn-danger-text"
                type="button"
                :disabled="voidingId === row.id || !row.orderId"
                @click="store.voidPayment(row)"
              >
                {{ voidingId === row.id ? 'Esperando terminal…' : 'Devolver' }}
              </button>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.refunds-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.toolbar-relaxed {
  gap: 1rem 1.25rem;
  padding: 1.25rem 1.4rem;
  margin-bottom: 0;
  align-items: flex-end;
}

.toolbar-relaxed .field {
  flex: 1 1 180px;
  min-width: 160px;
  max-width: none;
  margin-bottom: 0;
}

.toolbar-relaxed .field-user {
  flex: 1.4 1 240px;
  min-width: 220px;
}

.toolbar-relaxed .field label {
  font-size: 0.82rem;
  margin-bottom: 0.35rem;
  display: block;
}

.toolbar-relaxed .field input,
.toolbar-relaxed .field select {
  padding: 0.55rem 0.75rem;
  min-height: 42px;
  font-size: 0.95rem;
  width: 100%;
}

.toolbar-relaxed .btn {
  min-height: 42px;
  padding: 0.55rem 1.25rem;
  font-size: 0.95rem;
}

.table-wrap {
  padding: 0.35rem 0.5rem 0.75rem;
}

.hint-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--muted, #6b6b6b);
}

.btn-danger-text {
  color: var(--danger);
  border-color: rgba(203, 42, 29, 0.35);
}

.btn-danger-text:hover:not(:disabled) {
  background: rgba(203, 42, 29, 0.08);
}

@media (max-width: 860px) {
  .toolbar-relaxed {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem 1.1rem;
    padding: 1.25rem 1.2rem;
  }

  .toolbar-relaxed .field,
  .toolbar-relaxed .field-user {
    min-width: 0;
    max-width: none;
  }

  .toolbar-relaxed .btn {
    grid-column: 1 / -1;
    width: 100%;
  }
}

@media (max-width: 380px) {
  .toolbar-relaxed {
    grid-template-columns: 1fr;
  }
}
</style>
