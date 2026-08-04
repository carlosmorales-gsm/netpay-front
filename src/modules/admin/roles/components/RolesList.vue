<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { useRolesStore } from '../stores/roles'

const auth = useAuthStore()
const store = useRolesStore()
const { roles, loading, error } = storeToRefs(store)
</script>

<template>
  <div>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p>

    <div v-if="loading" class="card loading-row">
      <span class="spinner" />
      Cargando roles…
    </div>

    <div v-else-if="!roles.length" class="card empty-state">
      <strong>Sin roles</strong>
      Define roles para controlar el acceso por sección.
    </div>

    <div v-else class="roles-grid">
      <article v-for="role in roles" :key="role.id" class="card role-card">
        <header class="role-head">
          <div>
            <h2>{{ role.nombre }}</h2>
            <p>{{ role.descripcion || 'Sin descripción' }}</p>
          </div>
          <button
            v-if="auth.hasPermission('roles.manage')"
            class="btn btn-ghost btn-sm"
            type="button"
            @click="store.openEdit(role)"
          >
            Editar
          </button>
        </header>

        <div v-if="!role.permissions.length" class="empty-mini">Sin permisos asignados</div>

        <div v-else class="section-stack">
          <div
            v-for="section in store.groupedRolePermissions(role)"
            :key="`${role.id}-${section.sectionId}`"
            class="section-block"
          >
            <h3>{{ section.sectionLabel }}</h3>
            <div v-for="screen in section.screens" :key="screen.screenLabel" class="screen-block">
              <strong>{{ screen.screenLabel }}</strong>
              <div class="perms">
                <span v-for="p in screen.items" :key="p.id" class="badge badge-ok">
                  {{ p.codigo }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.role-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.role-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}

.role-head h2 {
  font-size: 1.35rem;
  margin-bottom: 0.2rem;
}

.role-head p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.section-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-block {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.75rem;
  background: #fbfaf7;
}

.section-block h3 {
  font-size: 0.95rem;
  margin-bottom: 0.55rem;
  color: var(--secondary);
}

.screen-block {
  margin-bottom: 0.55rem;
}

.screen-block:last-child {
  margin-bottom: 0;
}

.screen-block strong {
  display: block;
  font-size: 0.82rem;
  color: var(--muted);
  margin-bottom: 0.35rem;
}

.perms {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.empty-mini {
  color: var(--muted);
  font-size: 0.9rem;
}
</style>
