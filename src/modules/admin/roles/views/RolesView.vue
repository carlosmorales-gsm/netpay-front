<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { useRolesStore } from '../stores/roles'
import RolesList from '../components/RolesList.vue'
import RoleFormModal from '../components/RoleFormModal.vue'

const auth = useAuthStore()
const store = useRolesStore()
const { roles } = storeToRefs(store)

onMounted(() => store.fetchList())
</script>

<template>
  <section>
    <div class="page-header">
      <div>
        <h1>Roles y permisos</h1>
        <p>Permisos agrupados por sección del menú (Operación, Reportes, Administración)</p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-ghost"
          type="button"
          :disabled="!roles.length"
          @click="store.exportPdf()"
        >
          Descargar PDF
        </button>
        <button
          v-if="auth.hasPermission('roles.manage')"
          class="btn btn-gold"
          type="button"
          @click="store.openCreate()"
        >
          Nuevo rol
        </button>
      </div>
    </div>

    <RolesList />
    <RoleFormModal />
  </section>
</template>
