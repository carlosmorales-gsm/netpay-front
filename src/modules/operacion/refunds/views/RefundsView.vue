<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRefundsStore } from '../stores/refunds'
import RefundsList from '../components/RefundsList.vue'

const store = useRefundsStore()
const { total } = storeToRefs(store)

onMounted(() => store.init())
</script>

<template>
  <section class="refunds-page">
    <div class="page-header">
      <div>
        <h1>Devoluciones</h1>
        <p>
          Cancelación de cobros aplicados vía terminal NetPay (Smart Accounts).
          Solo mismo día, antes de las 8:00 p.m. CDMX.
        </p>
      </div>
      <div class="header-actions">
        <div class="stat-chip">
          <span>Elegibles</span>
          <strong>{{ total }}</strong>
        </div>
      </div>
    </div>

    <RefundsList />
  </section>
</template>

<style scoped>
.refunds-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.refunds-page :deep(.page-header) {
  margin-bottom: 0;
}
</style>
