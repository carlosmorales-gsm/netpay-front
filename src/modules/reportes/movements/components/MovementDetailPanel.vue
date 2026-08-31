<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import { copyText } from '@/shared/utils/copyText'
import type { Movement } from '../types'

const props = defineProps<{
  row: Movement
}>()

const auth = useAuthStore()
const ui = useUiStore()

const canSeeJson = computed(() => auth.hasPermission('movements.response_json'))

function prettyJson(value: unknown) {
  if (value == null || value === '') return ''
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const jsonText = computed(() => prettyJson(props.row.respuestaJson))

async function copyJson() {
  if (!jsonText.value) return
  const ok = await copyText(jsonText.value)
  if (ok) ui.success('JSON copiado')
  else ui.error('No se pudo copiar el JSON')
}
</script>

<template>
  <div class="detail">
    <p class="detail-summary">{{ row.detalle?.resumen || 'Sin detalle de respuesta' }}</p>
    <dl class="detail-grid">
      <div v-for="campo in row.detalle?.campos || []" :key="campo.label" class="detail-item">
        <dt>{{ campo.label }}</dt>
        <dd>{{ campo.value }}</dd>
      </div>
    </dl>

    <div v-if="canSeeJson" class="json-block">
      <div class="json-head">
        <span>JSON de respuesta</span>
        <button
          v-if="jsonText"
          class="btn btn-ghost btn-sm"
          type="button"
          @click.stop="copyJson"
        >
          Copiar
        </button>
      </div>
      <pre v-if="jsonText">{{ jsonText }}</pre>
      <p v-else class="json-empty">No hay JSON de respuesta para este movimiento.</p>
    </div>
  </div>
</template>

<style scoped>
.detail-summary {
  margin: 0 0 0.85rem;
  font-weight: 600;
  color: var(--primary);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem 1.25rem;
  margin: 0;
}

.detail-item dt {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
  margin-bottom: 0.2rem;
}

.detail-item dd {
  margin: 0;
  font-weight: 500;
  word-break: break-word;
}

.json-block {
  margin-top: 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--white);
  overflow: hidden;
}

.json-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  background: rgba(53, 100, 125, 0.08);
  border-bottom: 1px solid var(--border);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary);
}

.json-block pre {
  margin: 0;
  padding: 0.75rem 0.85rem;
  max-height: 320px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--ink);
  white-space: pre;
}

.json-empty {
  margin: 0;
  padding: 0.75rem 0.85rem;
  color: var(--muted);
  font-size: 0.88rem;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 560px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
