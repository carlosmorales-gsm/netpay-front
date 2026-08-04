<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/shared/stores/ui'

const ui = useUiStore()
const { toasts } = storeToRefs(ui)
</script>

<template>
  <div class="toast-stack" aria-live="polite" aria-relevant="additions">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="toast.tone"
      role="status"
    >
      <p>{{ toast.message }}</p>
      <button type="button" class="toast-close" @click="ui.dismissToast(toast.id)">×</button>
    </div>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: min(380px, calc(100vw - 2rem));
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 0.95rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--white);
  box-shadow: var(--shadow-lg);
  animation: toast-in 0.22s ease;
}

.toast p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.35;
  color: var(--ink);
}

.toast.success {
  border-color: rgba(53, 100, 125, 0.35);
  background: #f3f8fa;
}

.toast.error {
  border-color: rgba(203, 42, 29, 0.35);
  background: #fff5f4;
}

.toast.info {
  border-color: rgba(204, 160, 121, 0.45);
  background: #fbf7f2;
}

.toast-close {
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 1.15rem;
  line-height: 1;
  padding: 0;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
