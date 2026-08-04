<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/shared/stores/ui'

const ui = useUiStore()
const { confirmState } = storeToRefs(ui)
</script>

<template>
  <div
    v-if="confirmState.open"
    class="modal-backdrop confirm-backdrop"
    @click.self="ui.resolveConfirm(false)"
  >
    <div class="modal confirm-modal" role="alertdialog" aria-modal="true">
      <h2>{{ confirmState.title }}</h2>
      <p class="confirm-message">{{ confirmState.message }}</p>
      <div class="actions">
        <button class="btn btn-ghost" type="button" @click="ui.resolveConfirm(false)">
          {{ confirmState.cancelText }}
        </button>
        <button
          class="btn"
          :class="confirmState.danger ? 'btn-danger' : 'btn-primary'"
          type="button"
          @click="ui.resolveConfirm(true)"
        >
          {{ confirmState.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-backdrop {
  z-index: 90;
}

.confirm-modal {
  width: min(440px, 94vw);
}

.confirm-message {
  margin: 0 0 1.25rem;
  color: var(--muted);
  line-height: 1.45;
}
</style>
