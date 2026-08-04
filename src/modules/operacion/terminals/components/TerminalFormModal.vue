<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useTerminalsStore } from '../stores/terminals'

const store = useTerminalsStore()
const {
  showModal,
  editingId,
  form,
  modalError,
  saving,
  availableEmpresas,
  userHasAllEmpresas,
} = storeToRefs(store)
</script>

<template>
  <div v-if="showModal" class="modal-backdrop" @click.self="store.closeModal()">
    <div class="modal">
      <h2>{{ editingId ? 'Editar terminal' : 'Nueva terminal' }}</h2>
      <p class="modal-help">
        Los usuarios de terminal son de Odoo; selecciónalos con el buscador (no se capturan a mano).
      </p>

      <p v-if="modalError" class="error-text" role="alert">{{ modalError }}</p>

      <div class="field">
        <label>Usuario Odoo</label>
        <div class="odoo-selected">
          <div class="odoo-selected-copy">
            <template v-if="form.usuarioId">
              <strong>{{ form.nombreUsuario }}</strong>
              <small>ID {{ form.usuarioId }}</small>
            </template>
            <template v-else>
              <span class="placeholder">Ningún usuario seleccionado</span>
            </template>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" @click="store.openOdooSearch()">
            {{ form.usuarioId ? 'Cambiar' : 'Buscar usuario' }}
          </button>
        </div>
      </div>

      <div class="field">
        <label>Empresa</label>
        <select
          v-model="form.companyId"
          required
          :disabled="!form.usuarioId || userHasAllEmpresas"
        >
          <option disabled value="">Seleccione</option>
          <option v-for="e in availableEmpresas" :key="e.id" :value="e.id">
            {{ e.nombre }}
          </option>
        </select>
        <small v-if="form.usuarioId && userHasAllEmpresas" class="hint-error">
          El usuario ya está asignado en todas las empresas.
        </small>
        <small v-else-if="form.usuarioId" class="hint">
          Solo se muestran empresas donde aún no tiene terminal activa.
        </small>
      </div>
      <div class="field">
        <label>Store ID</label>
        <input
          v-model="form.storeId"
          maxlength="10"
          required
          :disabled="userHasAllEmpresas && !editingId"
        />
      </div>
      <div class="field">
        <label>Folio terminal</label>
        <input
          v-model="form.folioTerminal"
          maxlength="20"
          required
          :disabled="userHasAllEmpresas && !editingId"
        />
      </div>
      <div class="field">
        <label>
          <input v-model="form.activo" type="checkbox" />
          Activo
        </label>
      </div>
      <div class="actions">
        <button class="btn btn-ghost" type="button" @click="store.closeModal()">Cancelar</button>
        <button
          class="btn btn-primary"
          type="button"
          :disabled="saving || (userHasAllEmpresas && !editingId)"
          @click="store.save()"
        >
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-help {
  margin: -0.35rem 0 1rem;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

.odoo-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--white);
  padding: 0.7rem 0.8rem;
}

.odoo-selected-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.odoo-selected-copy strong {
  color: var(--ink);
  font-size: 0.95rem;
}

.odoo-selected-copy small {
  color: var(--muted);
}

.placeholder {
  color: var(--muted);
  font-size: 0.92rem;
}

.hint,
.hint-error {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
}

.hint {
  color: var(--muted);
}

.hint-error {
  color: var(--danger);
}
</style>
