<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useReversesStore } from '../stores/reverses'
import ReversesList from '../components/ReversesList.vue'

const store = useReversesStore()
const { data } = storeToRefs(store)

onMounted(() => store.init())
</script>

<template>
  <section class="reverses-page">
    <div class="page-header">
      <div>
        <h1>Reversos</h1>
        <p>
          Consulta por folioNumber en terminal (Smart Accounts). El reverso lo hace la Pax;
          el panel solo confirma RV o PRV y no aplica el pago.
        </p>
      </div>
      <div class="header-actions">
        <div class="stat-chip">
          <span>Posible</span>
          <strong>{{ data.totalPosible }}</strong>
        </div>
        <div class="stat-chip stat-chip-muted">
          <span>Pendiente (PRV)</span>
          <strong>{{ data.totalPendiente }}</strong>
        </div>
        <div class="stat-chip stat-chip-muted">
          <span>Reversada (RV)</span>
          <strong>{{ data.totalReversado }}</strong>
        </div>
      </div>
    </div>

    <ReversesList />
  </section>
</template>

<style scoped>
.reverses-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.reverses-page :deep(.page-header) {
  margin-bottom: 0;
}

.stat-chip-muted {
  background: var(--white);
  border: 1px solid var(--border);
}
</style>
