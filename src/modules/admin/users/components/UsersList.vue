<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { useUsersStore } from '../stores/users'

const auth = useAuthStore()
const store = useUsersStore()
const { users, loading, error } = storeToRefs(store)
</script>

<template>
  <div>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p>

    <div class="card table-wrap">
      <div v-if="loading" class="loading-row">
        <span class="spinner" />
        Cargando usuarios…
      </div>
      <div v-else-if="!users.length" class="empty-state">
        <strong>Sin usuarios</strong>
        Crea el primer usuario del panel.
      </div>
      <template v-else>
        <table class="data">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Odoo ID</th>
              <th>Estado</th>
              <th v-if="auth.hasPermission('users.manage')">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.nombre }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.roleNombre }}</td>
              <td>{{ user.odooUserId ?? '—' }}</td>
              <td>
                <span class="badge" :class="user.activo ? 'badge-ok' : 'badge-off'">
                  {{ user.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td v-if="auth.hasPermission('users.manage')" class="actions">
                <button class="btn btn-ghost btn-sm" type="button" @click="store.openEdit(user)">
                  Editar
                </button>
                <button
                  v-if="user.activo"
                  class="btn btn-danger btn-sm"
                  type="button"
                  @click="store.deactivate(user)"
                >
                  Desactivar
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="data-cards">
          <article v-for="user in users" :key="`card-${user.id}`" class="data-card">
            <div class="data-card-head">
              <strong>{{ user.nombre }}</strong>
              <span class="badge" :class="user.activo ? 'badge-ok' : 'badge-off'">
                {{ user.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <div class="data-card-meta">
              <div class="row">
                <span>Email</span>
                <b>{{ user.email }}</b>
              </div>
              <div class="row">
                <span>Rol</span>
                <b>{{ user.roleNombre }}</b>
              </div>
              <div class="row">
                <span>Odoo ID</span>
                <b>{{ user.odooUserId ?? '—' }}</b>
              </div>
            </div>
            <div v-if="auth.hasPermission('users.manage')" class="actions">
              <button class="btn btn-ghost btn-sm" type="button" @click="store.openEdit(user)">
                Editar
              </button>
              <button
                v-if="user.activo"
                class="btn btn-danger btn-sm"
                type="button"
                @click="store.deactivate(user)"
              >
                Desactivar
              </button>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 860px) {
  .actions .btn {
    flex: 1 1 auto;
  }
}
</style>
