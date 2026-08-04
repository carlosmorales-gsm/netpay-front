<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { useEmpresasStore } from '@/shared/stores/empresas'
import { useTerminalsStore } from '../stores/terminals'

const auth = useAuthStore()
const store = useTerminalsStore()
const empresas = useEmpresasStore()
const {
  items,
  loading,
  error,
  filters,
  filteredUserOptions,
  showUserSuggestions,
  testingId,
  togglingId,
} = storeToRefs(store)
</script>

<template>
  <div>
    <div class="card toolbar">
      <div class="field autocomplete-field">
        <label>Usuario</label>
        <div class="autocomplete">
          <input
            v-model="filters.nombreUsuario"
            type="search"
            placeholder="Buscar por nombre…"
            autocomplete="off"
            @focus="showUserSuggestions = true"
            @input="store.onNombreUsuarioInput()"
            @keyup.enter="store.fetchList(); showUserSuggestions = false"
          />
          <button
            v-if="filters.nombreUsuario || filters.usuarioId"
            class="clear-btn"
            type="button"
            title="Limpiar"
            @click="store.clearUserFilter(); store.fetchList()"
          >
            ×
          </button>
          <ul v-if="showUserSuggestions && filteredUserOptions.length" class="suggestions">
            <li v-for="opt in filteredUserOptions" :key="`${opt.usuarioId}-${opt.nombreUsuario}`">
              <button type="button" @click="store.selectUserFilter(opt)">
                <strong>{{ opt.nombreUsuario }}</strong>
                <small>ID {{ opt.usuarioId }}</small>
              </button>
            </li>
          </ul>
        </div>
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
        <label>Activo</label>
        <select v-model="filters.activo">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
      <button
        class="btn btn-primary"
        type="button"
        @click="showUserSuggestions = false; store.fetchList()"
      >
        Filtrar
      </button>
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
            <td>{{ empresas.nombre(row.companyId) }}</td>
            <td>{{ row.storeId }}</td>
            <td>{{ row.folioTerminal }}</td>
            <td>
              <label
                v-if="auth.hasPermission('terminals.manage')"
                class="switch"
                :title="row.activo ? 'Activa' : 'Inactiva'"
              >
                <input
                  type="checkbox"
                  :checked="row.activo"
                  :disabled="togglingId === row.id"
                  @change="store.toggleActivo(row)"
                />
                <span class="slider" />
              </label>
              <span v-else class="badge" :class="row.activo ? 'badge-ok' : 'badge-off'">
                {{ row.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td v-if="auth.hasPermission('terminals.manage')" class="actions">
              <button class="btn btn-ghost btn-sm" type="button" @click="store.openEdit(row)">
                Editar
              </button>
              <button
                class="btn btn-gold btn-sm"
                type="button"
                :disabled="!row.activo || testingId === row.id"
                title="Cobro de prueba $0.10 (10 centavos)"
                @click="store.testCharge(row)"
              >
                {{ testingId === row.id ? 'Enviando…' : 'Test' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.autocomplete-field {
  position: relative;
  min-width: 220px;
}

.autocomplete {
  position: relative;
}

.autocomplete input {
  padding-right: 2rem;
}

.clear-btn {
  position: absolute;
  right: 0.45rem;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  z-index: 2;
}

.suggestions {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 30;
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow);
  max-height: 220px;
  overflow: auto;
}

.suggestions button {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  border-bottom: 1px solid var(--border);
}

.suggestions li:last-child button {
  border-bottom: 0;
}

.suggestions button:hover {
  background: rgba(53, 100, 125, 0.08);
}

.suggestions small {
  color: var(--muted);
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background: #c9c9c9;
  border-radius: 999px;
  transition: 0.2s ease;
}

.slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.switch input:checked + .slider {
  background: var(--primary);
}

.switch input:checked + .slider::before {
  transform: translateX(20px);
}

.switch input:disabled + .slider {
  opacity: 0.55;
  cursor: wait;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
</style>
