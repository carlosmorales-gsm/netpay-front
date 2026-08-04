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
      <table v-else class="data">
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
    </div>
  </div>
</template>
