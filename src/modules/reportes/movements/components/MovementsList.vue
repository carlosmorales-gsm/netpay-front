<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEmpresasStore } from '@/shared/stores/empresas'
import { MOVEMENT_TYPE_OPTIONS, useMovementsStore } from '../stores/movements'

const store = useMovementsStore()
const empresas = useEmpresasStore()
const { loading, error, data, filters, userOptions, reprintingId } = storeToRefs(store)
const typeOptions = MOVEMENT_TYPE_OPTIONS

function estatusClass(key?: string) {
  if (key === 'applied') return 'badge-ok'
  if (key === 'approved') return 'badge-warn'
  if (key === 'refunded' || key === 'void') return 'badge-refunded'
  if (key === 'cancelled') return 'badge-off'
  if (key === 'declined') return 'badge-off'
  return 'badge-off'
}
</script>

<template>
  <div class="movements-list">
    <div class="card toolbar toolbar-relaxed">
      <div class="field field-user">
        <label>Usuario</label>
        <select v-model="filters.usuarioId">
          <option value="">Todos</option>
          <option
            v-for="u in userOptions"
            :key="u.usuarioId"
            :value="String(u.usuarioId)"
          >
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
      <div class="field">
        <label>Tipo</label>
        <select v-model="filters.tipoTransaccion">
          <option value="">Todos</option>
          <option v-for="t in typeOptions" :key="t.id" :value="String(t.id)">
            {{ t.label }}
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
      <button class="btn btn-primary" type="button" @click="store.fetchList()">
        Filtrar
      </button>
    </div>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>

    <div class="card table-wrap">
      <div v-if="loading" class="loading-row">
        <span class="spinner" />
        Cargando movimientos…
      </div>
      <div v-else-if="!data.items.length" class="empty-state">
        <strong>Sin movimientos</strong>
        No hay transacciones para los filtros seleccionados.
      </div>
      <template v-else>
        <table class="data">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Folio</th>
              <th>Order</th>
              <th>Usuario</th>
              <th>Empresa</th>
              <th>Importe</th>
              <th>Estatus</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data.items" :key="row.id">
              <td>{{ new Date(row.fechaTransacciones).toLocaleString('es-MX') }}</td>
              <td>{{ row.tipoTransaccionDesc || '—' }}</td>
              <td>{{ row.folioVenta }}</td>
              <td>{{ row.orderId || '—' }}</td>
              <td>{{ row.usuarioNombre || `ID ${row.usuarioId}` }}</td>
              <td>{{ empresas.nombre(row.companyId) }}</td>
              <td>{{ store.money(row.importe) }}</td>
              <td>
                <span class="badge" :class="estatusClass(row.estatus?.key)">
                  {{
                    row.estatus?.label ||
                    (row.aplicado ? 'Aplicado' : row.tipoRespuesta || 'Sin respuesta')
                  }}
                </span>
              </td>
              <td class="actions">
                <button
                  v-if="store.canReprint(row)"
                  class="btn-icon"
                  type="button"
                  title="Reimprimir ticket"
                  :disabled="reprintingId === row.id"
                  @click="store.reprintTicket(row)"
                >
                  <svg
                    v-if="reprintingId !== row.id"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 14H8v-4h8v4zm2-4v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"
                    />
                    <path fill="currentColor" d="M18 12.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                  </svg>
                  <span v-else class="spinner" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="data-cards">
          <article v-for="row in data.items" :key="`card-${row.id}`" class="data-card">
            <div class="data-card-head">
              <strong>{{ store.money(row.importe) }}</strong>
              <span class="badge" :class="estatusClass(row.estatus?.key)">
                {{
                  row.estatus?.label ||
                  (row.aplicado ? 'Aplicado' : row.tipoRespuesta || 'Sin respuesta')
                }}
              </span>
            </div>
            <div class="data-card-meta">
              <div class="row">
                <span>Fecha</span>
                <b>{{ new Date(row.fechaTransacciones).toLocaleString('es-MX') }}</b>
              </div>
              <div class="row">
                <span>Tipo</span>
                <b>{{ row.tipoTransaccionDesc || '—' }}</b>
              </div>
              <div class="row">
                <span>Folio</span>
                <b>{{ row.folioVenta }}</b>
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
                <span>Empresa</span>
                <b>{{ empresas.nombre(row.companyId) }}</b>
              </div>
            </div>
            <div v-if="store.canReprint(row)" class="actions">
              <button
                class="btn btn-ghost btn-sm reprint-btn"
                type="button"
                :disabled="reprintingId === row.id"
                @click="store.reprintTicket(row)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 14H8v-4h8v4zm2-4v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"
                  />
                </svg>
                {{ reprintingId === row.id ? 'Enviando…' : 'Reimprimir ticket' }}
              </button>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.movements-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.btn-icon {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  background: var(--white);
  color: var(--primary);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.btn-icon:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--secondary);
  background: rgba(204, 160, 121, 0.12);
}

.btn-icon:disabled {
  opacity: 0.55;
  cursor: wait;
}

.reprint-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
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
  align-self: flex-end;
}

.table-wrap {
  padding: 0.35rem 0.5rem 0.75rem;
}

.badge-warn {
  background: rgba(204, 160, 121, 0.22);
  color: #8a5a2b;
}

.badge-refunded {
  background: rgba(70, 110, 160, 0.16);
  color: #2f4f7a;
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
