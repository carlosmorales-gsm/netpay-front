<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMovementsStore } from '../stores/movements'
import MovementsList from '../components/MovementsList.vue'

const store = useMovementsStore()
const { data } = storeToRefs(store)

onMounted(() => store.init())
</script>

<template>
  <section class="movements-page">
    <div class="page-header">
      <div>
        <h1>Movimientos</h1>
        <p>Todos los movimientos de terminal · el total suma solo ingresos aplicados</p>
      </div>
      <div class="header-actions">
        <div class="stat-chip">
          <span>{{ data.totalAplicados }} aplicados / {{ data.total }} registros</span>
          <strong>{{ store.money(data.totalImporteAplicado) }}</strong>
        </div>
        <button
          class="btn btn-ghost"
          type="button"
          :disabled="!data.items.length"
          @click="store.exportPdf()"
        >
          Descargar PDF
        </button>
      </div>
    </div>

    <MovementsList />
  </section>
</template>

<style scoped>
.movements-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.movements-page :deep(.page-header) {
  margin-bottom: 0;
}
</style>
