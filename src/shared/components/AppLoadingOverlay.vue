<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/shared/stores/ui'

const ui = useUiStore()
const { isLoading } = storeToRefs(ui)
</script>

<template>
  <div v-if="isLoading" class="loading-overlay" role="status" aria-live="polite" aria-busy="true">
    <div class="loading-card">
      <span class="spinner" />
      <p>Cargando…</p>
    </div>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  background: rgba(249, 243, 238, 0.55);
  backdrop-filter: blur(2px);
}

.loading-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background: var(--white);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  color: var(--primary);
  font-weight: 500;
}

.loading-card p {
  margin: 0;
}
</style>
