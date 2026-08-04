<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { useTerminalsStore } from '../stores/terminals'
import TerminalsList from '../components/TerminalsList.vue'
import TerminalFormModal from '../components/TerminalFormModal.vue'
import TerminalOdooSearchModal from '../components/TerminalOdooSearchModal.vue'

const auth = useAuthStore()
const store = useTerminalsStore()
const { items } = storeToRefs(store)

onMounted(() => store.init())
</script>

<template>
  <section>
    <div class="page-header">
      <div>
        <h1>Terminales</h1>
        <p>Asignación de terminales NetPay a usuarios Odoo por empresa</p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-ghost"
          type="button"
          :disabled="!items.length"
          @click="store.exportPdf()"
        >
          Descargar PDF
        </button>
        <button
          v-if="auth.hasPermission('terminals.manage')"
          class="btn btn-gold"
          type="button"
          @click="store.openCreate()"
        >
          Nueva terminal
        </button>
      </div>
    </div>

    <TerminalsList />
    <TerminalFormModal />
    <TerminalOdooSearchModal />
  </section>
</template>
