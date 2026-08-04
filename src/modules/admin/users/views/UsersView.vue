<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { useUsersStore } from '../stores/users'
import UsersList from '../components/UsersList.vue'
import UserFormModal from '../components/UserFormModal.vue'

const auth = useAuthStore()
const store = useUsersStore()
const { users } = storeToRefs(store)

onMounted(() => store.fetchList())
</script>

<template>
  <section>
    <div class="page-header">
      <div>
        <h1>Usuarios</h1>
        <p>Administración de usuarios y asignación de roles</p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-ghost"
          type="button"
          :disabled="!users.length"
          @click="store.exportPdf()"
        >
          Descargar PDF
        </button>
        <button
          v-if="auth.hasPermission('users.manage')"
          class="btn btn-gold"
          type="button"
          @click="store.openCreate()"
        >
          Nuevo usuario
        </button>
      </div>
    </div>

    <UsersList />
    <UserFormModal />
  </section>
</template>
