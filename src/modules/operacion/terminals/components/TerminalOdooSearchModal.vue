<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useTerminalsStore } from '../stores/terminals'

const store = useTerminalsStore()
const { showOdooModal, odooQuery, odooResults, odooSearching, odooError } = storeToRefs(store)
</script>

<template>
  <div v-if="showOdooModal" class="modal-backdrop nested" @click.self="store.closeOdooSearch()">
    <div class="modal">
      <h2>Buscar usuario Odoo</h2>
      <p class="modal-help">Busca por nombre, login o correo. Ejemplo: claudia.</p>

      <div class="field">
        <label>Referencia</label>
        <div class="search-row">
          <input
            v-model="odooQuery"
            type="search"
            placeholder="Ej. claudia"
            autofocus
            @keyup.enter="store.searchOdooUsers()"
          />
          <button
            class="btn btn-primary"
            type="button"
            :disabled="odooSearching"
            @click="store.searchOdooUsers()"
          >
            {{ odooSearching ? 'Buscando…' : 'Buscar' }}
          </button>
        </div>
      </div>

      <p v-if="odooError" class="error-text" role="alert">{{ odooError }}</p>

      <div v-if="odooSearching" class="loading-row">
        <span class="spinner" />
        Consultando api-odoo…
      </div>

      <ul v-else-if="odooResults.length" class="odoo-results">
        <li v-for="user in odooResults" :key="user.id">
          <button type="button" class="odoo-option" @click="store.selectOdooUser(user)">
            <strong>{{ user.nombre || 'Sin nombre' }}</strong>
            <small>ID {{ user.id }} · {{ user.correo || 'sin correo' }}</small>
          </button>
        </li>
      </ul>

      <div class="actions">
        <button class="btn btn-ghost" type="button" @click="store.closeOdooSearch()">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop.nested {
  z-index: 60;
  background: rgba(40, 75, 94, 0.55);
}

.modal-help {
  margin: -0.35rem 0 1rem;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

.search-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
}

.odoo-results {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  max-height: 280px;
  overflow-y: auto;
  background: var(--white);
}

.odoo-option {
  width: 100%;
  text-align: left;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: var(--white);
  padding: 0.75rem 0.85rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.odoo-option:last-child {
  border-bottom: 0;
}

.odoo-option:hover {
  background: rgba(53, 100, 125, 0.08);
}

.odoo-option small {
  color: var(--muted);
}

.loading-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
  color: var(--muted);
}
</style>
