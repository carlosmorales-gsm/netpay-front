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

      <dl v-if="confirmState.details?.length" class="confirm-details">
        <div v-for="item in confirmState.details" :key="item.label" class="confirm-detail">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>

      <p v-if="confirmState.hint" class="confirm-hint">{{ confirmState.hint }}</p>

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
  width: min(460px, 94vw);
  padding: 1.45rem 1.5rem 1.3rem;
}

.confirm-modal h2 {
  margin-bottom: 0.65rem;
}

.confirm-message {
  margin: 0 0 1rem;
  color: var(--ink);
  line-height: 1.5;
  font-size: 0.98rem;
}

.confirm-details {
  display: grid;
  gap: 0.7rem;
  margin: 0 0 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--cream-alt);
}

.confirm-detail {
  display: grid;
  grid-template-columns: 7.2rem 1fr;
  gap: 0.6rem;
  align-items: baseline;
}

.confirm-detail dt {
  margin: 0;
  color: var(--muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.confirm-detail dd {
  margin: 0;
  font-weight: 600;
  color: var(--ink);
  word-break: break-word;
}

.confirm-hint {
  margin: 0 0 1.25rem;
  padding: 0.7rem 0.85rem;
  border-radius: var(--radius);
  background: rgba(53, 100, 125, 0.08);
  color: var(--secondary);
  font-size: 0.88rem;
  line-height: 1.45;
}

.confirm-modal .actions {
  margin-top: 0.25rem;
  gap: 0.7rem;
}
</style>
