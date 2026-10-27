<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useEmpresasStore } from '@/shared/stores/empresas'
import { formatLocalDateParts } from '@/shared/utils/formatDate'
import { MOVEMENT_TYPE_OPTIONS, useMovementsStore } from '../stores/movements'
import MovementDetailPanel from './MovementDetailPanel.vue'

const store = useMovementsStore()
const empresas = useEmpresasStore()
const { loading, error, data, filters, userOptions } = storeToRefs(store)
const typeOptions = MOVEMENT_TYPE_OPTIONS
const expandedId = ref<number | null>(null)

function toggleDetail(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}

function estatusClass(key?: string) {
  if (key === 'applied') return 'badge-ok'
  if (key === 'approved') return 'badge-warn'
  if (key === 'reversed') return 'badge-reversed'
  if (key === 'pending_reverse') return 'badge-prv'
  if (key === 'possible_reverse') return 'badge-reverse'
  if (key === 'refunded' || key === 'void') return 'badge-refunded'
  if (key === 'cancelled') return 'badge-off'
  if (key === 'declined') return 'badge-off'
  return 'badge-off'
}

function typeClass(tipo?: number | null) {
  if (tipo === 2) return 'type-void'
  if (tipo === 3) return 'type-reprint'
  return 'type-sale'
}

function typeLabel(row: { tipoTransaccion?: number | null; tipoTransaccionDesc?: string | null }) {
  if (row.tipoTransaccion === 1) return 'Cobro'
  if (row.tipoTransaccion === 2) return 'Cancelación'
  if (row.tipoTransaccion === 3) return 'Reimpresión'
  return row.tipoTransaccionDesc || '—'
}

function isReprint(row: { tipoTransaccion?: number | null }) {
  return row.tipoTransaccion === 3
}

function empresaNombre(row: { empresaNombre?: string | null; companyId: number | null }) {
  return row.empresaNombre || empresas.nombre(row.companyId)
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
      <div class="field-range">
        <div class="field">
          <label>Desde</label>
          <input v-model="filters.from" type="date" />
        </div>
        <div class="field">
          <label>Hasta</label>
          <input v-model="filters.to" type="date" />
        </div>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-primary" type="button" @click="store.fetchList()">
          Filtrar
        </button>
        <button
          v-if="store.hasActiveFilters()"
          class="btn btn-ghost"
          type="button"
          @click="store.clearFilters()"
        >
          Limpiar
        </button>
      </div>
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
        <table class="data movements-table">
          <thead>
            <tr>
              <th class="col-toggle"></th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Folio de venta / folioNumber / orderId</th>
              <th>Usuario / Terminal / Empresa</th>
              <th class="col-amount">Importe</th>
              <th>Estatus</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in data.items" :key="row.id">
            <tr
              class="row-main"
              :class="{ 'is-open': expandedId === row.id }"
              @click="toggleDetail(row.id)"
            >
              <td class="col-toggle">
                <button
                  class="btn-toggle"
                  type="button"
                  :aria-expanded="expandedId === row.id"
                  :title="expandedId === row.id ? 'Ocultar detalle' : 'Ver respuesta'"
                  @click.stop="toggleDetail(row.id)"
                >
                  {{ expandedId === row.id ? '▾' : '▸' }}
                </button>
              </td>
              <td>
                <div class="when">
                  <span class="when-date">{{ formatLocalDateParts(row.fechaTransacciones).date }}</span>
                  <span class="when-time">{{ formatLocalDateParts(row.fechaTransacciones).time }}</span>
                </div>
              </td>
              <td>
                <span class="type-chip" :class="typeClass(row.tipoTransaccion)">
                  {{ typeLabel(row) }}
                </span>
              </td>
              <td class="col-folios">
                <span class="id-label">Folio de venta</span>
                <span class="folio-sale">{{ row.folioVenta }}</span>
                <span class="id-label">folioNumber</span>
                <span class="folio-np" :title="row.folioNumber || ''">
                  {{ row.folioNumber || '—' }}
                </span>
                <span class="id-label">orderId</span>
                <span class="folio-np" :title="row.orderId || ''">
                  {{ row.orderId || '—' }}
                </span>
              </td>
              <td class="col-who">
                <span class="id-label">Usuario</span>
                <span class="folio-sale">{{ row.usuarioNombre || `ID ${row.usuarioId}` }}</span>
                <span class="id-label">Terminal</span>
                <span class="folio-np">{{ row.folioTerminal || row.storeId || '—' }}</span>
                <span class="id-label">Empresa</span>
                <span class="folio-np">{{ empresaNombre(row) }}</span>
              </td>
              <td class="col-amount">{{ store.money(row.importe) }}</td>
              <td class="col-estatus">
                <div v-if="!isReprint(row)" class="estatus-cell">
                  <span class="badge" :class="estatusClass(row.estatus?.key)">
                    {{
                      row.estatus?.label ||
                      (row.aplicado ? 'Aplicado' : row.tipoRespuesta || 'Sin respuesta')
                    }}
                  </span>
                  <button
                    v-if="store.canApplyPayment(row)"
                    class="btn btn-primary btn-sm"
                    type="button"
                    :disabled="store.applyingId === row.id"
                    @click.stop="store.applyPayment(row)"
                  >
                    Aplicar pago
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="expandedId === row.id" class="row-detail">
              <td colspan="7">
                <MovementDetailPanel :row="row" />
              </td>
            </tr>
            </template>
          </tbody>
        </table>

        <div class="data-cards">
          <article v-for="row in data.items" :key="`card-${row.id}`" class="data-card">
            <div class="data-card-head">
              <strong>{{ store.money(row.importe) }}</strong>
              <span
                v-if="!isReprint(row)"
                class="badge"
                :class="estatusClass(row.estatus?.key)"
              >
                {{
                  row.estatus?.label ||
                  (row.aplicado ? 'Aplicado' : row.tipoRespuesta || 'Sin respuesta')
                }}
              </span>
            </div>
            <button
              v-if="store.canApplyPayment(row)"
              class="btn btn-primary btn-sm apply-card-btn"
              type="button"
              :disabled="store.applyingId === row.id"
              @click.stop="store.applyPayment(row)"
            >
              Aplicar pago
            </button>
            <div class="data-card-meta">
              <div class="row">
                <span>Fecha</span>
                <b>
                  {{ formatLocalDateParts(row.fechaTransacciones).date }}
                  {{ formatLocalDateParts(row.fechaTransacciones).time }}
                </b>
              </div>
              <div class="row">
                <span>Tipo</span>
                <b>{{ typeLabel(row) }}</b>
              </div>
              <div class="row">
                <span>Folio de venta</span>
                <b>{{ row.folioVenta }}</b>
              </div>
              <div class="row">
                <span>folioNumber</span>
                <b class="folio-np">{{ row.folioNumber || '—' }}</b>
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
                <b>{{ empresaNombre(row) }}</b>
              </div>
            </div>
            <button
              class="btn btn-ghost btn-sm detail-toggle"
              type="button"
              @click="toggleDetail(row.id)"
            >
              {{ expandedId === row.id ? 'Ocultar respuesta' : 'Ver respuesta' }}
            </button>
            <MovementDetailPanel v-if="expandedId === row.id" :row="row" />
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

.toolbar-relaxed {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.1rem;
  padding: 1.15rem 1.3rem;
  margin-bottom: 0;
  align-items: flex-end;
}

.toolbar-relaxed .field {
  flex: 1 1 160px;
  min-width: 150px;
  max-width: none;
  margin-bottom: 0;
}

.toolbar-relaxed .field-user {
  flex: 1.3 1 220px;
}

.field-range {
  display: flex;
  gap: 0.75rem;
  flex: 1.2 1 260px;
  min-width: 240px;
}

.field-range .field {
  flex: 1 1 0;
  min-width: 0;
}

.toolbar-actions {
  display: flex;
  gap: 0.6rem;
  align-items: flex-end;
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
  padding: 0.55rem 1.15rem;
  font-size: 0.95rem;
}

.table-wrap {
  padding: 0.2rem 0.5rem 0.6rem;
  overflow-x: hidden;
}

.movements-table {
  width: 100%;
  min-width: 0;
  table-layout: auto;
}

.movements-table th,
.movements-table td {
  max-width: none;
  padding: 0.7rem 0.7rem;
}

.col-folios {
  min-width: 0;
  width: 32%;
}

.folio-sale,
.folio-np {
  display: block;
  line-height: 1.3;
}

.id-label {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.id-label:first-child {
  margin-top: 0;
}

.folio-sale {
  font-weight: 500;
  word-break: break-word;
}

.folio-np {
  margin-top: 0.15rem;
  font-size: 0.78rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  word-break: break-all;
}

.col-who {
  min-width: 0;
  width: 28%;
}

.col-estatus {
  width: 1%;
  white-space: nowrap;
}

.estatus-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.apply-card-btn {
  width: 100%;
  margin: 0.15rem 0 0.55rem;
}

.col-toggle {
  width: 42px;
  padding-right: 0.25rem;
}

.btn-toggle {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  background: var(--white);
  color: var(--primary);
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
}

.row-main {
  cursor: pointer;
}

.row-main.is-open {
  background: rgba(53, 100, 125, 0.04);
}

.row-detail td {
  background: var(--cream-alt);
  padding: 0.85rem 1rem 1.1rem;
  max-width: none;
}

.detail-toggle {
  width: 100%;
  margin-top: 0.15rem;
}

.when {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  line-height: 1.25;
}

.when-date {
  font-weight: 500;
  color: var(--ink);
}

.when-time {
  font-size: 0.8rem;
  color: var(--muted);
}

.type-chip {
  display: inline-block;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.type-sale {
  background: rgba(53, 100, 125, 0.1);
  color: var(--primary);
}

.type-void {
  background: rgba(203, 42, 29, 0.08);
  color: #9a2218;
}

.type-reprint {
  background: rgba(40, 75, 94, 0.08);
  color: var(--secondary);
}

.mono {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.col-amount {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  white-space: nowrap;
  width: 1%;
}

.data-card .folio-np {
  white-space: normal;
  word-break: break-all;
}

.badge-warn {
  background: rgba(204, 160, 121, 0.22);
  color: #8a5a2b;
}

.badge-refunded {
  background: rgba(70, 110, 160, 0.16);
  color: #2f4f7a;
}

.badge-reverse {
  background: rgba(204, 160, 121, 0.28);
  color: #8a5a2b;
}

.badge-prv {
  background: rgba(180, 120, 40, 0.18);
  color: #7a4a12;
}

.badge-reversed {
  background: rgba(53, 100, 125, 0.16);
  color: var(--secondary);
}

@media (max-width: 860px) {
  .toolbar-relaxed {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem 1.1rem;
    padding: 1.25rem 1.2rem;
  }

  .toolbar-relaxed .field,
  .toolbar-relaxed .field-user,
  .field-range {
    min-width: 0;
    max-width: none;
    grid-column: auto;
  }

  .field-range {
    grid-column: 1 / -1;
  }

  .toolbar-actions {
    grid-column: 1 / -1;
  }

  .toolbar-actions .btn {
    flex: 1;
  }
}

@media (max-width: 380px) {
  .toolbar-relaxed {
    grid-template-columns: 1fr;
  }
}
</style>
