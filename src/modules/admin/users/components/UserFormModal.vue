<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUsersStore } from '../stores/users'

const store = useUsersStore()
const {
  showModal,
  editingId,
  form,
  roles,
  modalError,
  saving,
  odooQuery,
  odooResults,
  odooSearching,
  odooError,
} = storeToRefs(store)
</script>

<template>
  <div v-if="showModal" class="modal-backdrop" @click.self="store.closeModal()">
    <div class="modal">
      <h2>{{ editingId ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
      <p v-if="modalError" class="error-text" role="alert">{{ modalError }}</p>

      <div class="field">
        <label>Buscar en Odoo (opcional)</label>
        <div class="search-row">
          <input
            v-model="odooQuery"
            type="search"
            placeholder="Ej. claudia"
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
        <p v-if="odooError" class="error-text" role="alert">{{ odooError }}</p>
        <ul v-if="odooResults.length" class="odoo-results">
          <li v-for="user in odooResults" :key="user.id">
            <button type="button" class="odoo-option" @click="store.selectOdooUser(user)">
              <strong>{{ user.nombre || 'Sin nombre' }}</strong>
              <small>ID {{ user.id }} · {{ user.correo || 'sin correo' }}</small>
            </button>
          </li>
        </ul>
      </div>

      <div class="field">
        <label>Nombre</label>
        <input v-model="form.nombre" required />
      </div>
      <div class="field">
        <label>Email</label>
        <input v-model="form.email" type="email" required />
      </div>
      <div class="field">
        <label>{{ editingId ? 'Nueva contraseña (opcional)' : 'Contraseña' }}</label>
        <input v-model="form.password" type="password" :required="!editingId" />
      </div>
      <div class="field">
        <label>Rol</label>
        <select v-model="form.roleId" required>
          <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.nombre }}</option>
        </select>
      </div>
      <div class="field">
        <label>Odoo User ID</label>
        <input v-model="form.odooUserId" type="number" placeholder="Opcional" />
      </div>
      <div class="field">
        <label>
          <input v-model="form.activo" type="checkbox" />
          Activo
        </label>
      </div>
      <div class="actions">
        <button class="btn btn-ghost" type="button" @click="store.closeModal()">Cancelar</button>
        <button class="btn btn-primary" type="button" :disabled="saving" @click="store.save()">
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
}

.odoo-results {
  list-style: none;
  margin: 0.55rem 0 0;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  max-height: 180px;
  overflow-y: auto;
}

.odoo-option {
  width: 100%;
  text-align: left;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: var(--white);
  padding: 0.65rem 0.75rem;
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
</style>
