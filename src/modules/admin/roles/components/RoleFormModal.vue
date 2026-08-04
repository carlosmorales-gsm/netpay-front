<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRolesStore } from '../stores/roles'

const store = useRolesStore()
const {
  showModal,
  editing,
  form,
  modalError,
  saving,
  permissionSections,
} = storeToRefs(store)
</script>

<template>
  <div v-if="showModal" class="modal-backdrop" @click.self="store.closeModal()">
    <div class="modal wide">
      <h2>{{ editing ? 'Editar rol' : 'Nuevo rol' }}</h2>
      <p v-if="modalError" class="error-text" role="alert">{{ modalError }}</p>

      <div class="field">
        <label>Nombre</label>
        <input v-model="form.nombre" required />
      </div>
      <div class="field">
        <label>Descripción</label>
        <input v-model="form.descripcion" />
      </div>

      <div class="field">
        <label>Permisos por sección</label>
        <div class="permission-sections">
          <section
            v-for="section in permissionSections"
            :key="section.sectionId"
            class="perm-section"
          >
            <header class="perm-section-head">
              <label class="section-toggle">
                <input
                  type="checkbox"
                  :checked="store.isSectionFullySelected(section.screens)"
                  :indeterminate="store.isSectionPartiallySelected(section.screens)"
                  @change="store.toggleSection(section.screens)"
                />
                <h3>{{ section.sectionLabel }}</h3>
              </label>
            </header>

            <div
              v-for="screen in section.screens"
              :key="screen.screenLabel"
              class="perm-screen"
            >
              <label class="screen-toggle">
                <input
                  type="checkbox"
                  :checked="store.isScreenFullySelected(screen.items)"
                  :indeterminate="store.isScreenPartiallySelected(screen.items)"
                  @change="store.toggleScreen(screen.items)"
                />
                <span>Pantalla: {{ screen.screenLabel }}</span>
              </label>

              <div class="checkbox-grid">
                <label v-for="perm in screen.items" :key="perm.id" class="checkbox-item">
                  <input
                    type="checkbox"
                    :checked="form.permissionIds.includes(perm.id)"
                    @change="store.togglePermission(perm.id)"
                  />
                  <span>
                    <strong>{{ perm.codigo }}</strong>
                    <small>{{ perm.descripcion }}</small>
                  </span>
                </label>
              </div>
            </div>
          </section>
        </div>
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
.modal.wide {
  width: min(860px, 96vw);
  max-height: min(90vh, 920px);
  overflow: auto;
  background: var(--cream-alt);
}

.permission-sections {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.perm-section {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  overflow: hidden;
}

.perm-section-head {
  padding: 0.65rem 0.85rem;
  background: rgba(53, 100, 125, 0.08);
  border-bottom: 1px solid var(--border);
}

.section-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.perm-section-head h3 {
  margin: 0;
  font-size: 1rem;
}

.perm-screen {
  padding: 0.75rem 0.85rem 0.9rem;
  border-bottom: 1px solid var(--border);
}

.perm-screen:last-child {
  border-bottom: 0;
}

.screen-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.65rem;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
}

.checkbox-item span {
  display: flex;
  flex-direction: column;
}

.checkbox-item small {
  color: var(--muted);
}
</style>
