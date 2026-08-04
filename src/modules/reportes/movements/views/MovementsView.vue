<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { useMovementsStore } from '../stores/movements'
import MovementsList from '../components/MovementsList.vue'

const auth = useAuthStore()
const store = useMovementsStore()
const { scope, data } = storeToRefs(store)

const canGlobal = computed(() => auth.hasPermission('movements.global'))

onMounted(() => store.init())
</script>

<template>
  <section>
    <div class="page-header">
      <div>
        <h1>Movimientos</h1>
        <p>Ingresos y transacciones registradas</p>
      </div>
      <div class="header-actions">
        <div class="stat-chip">
          <span>{{ data.total }} registros</span>
          <strong>{{ store.money(data.totalImporte) }}</strong>
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

    <div class="tabs">
      <button
        class="tab"
        :class="{ active: scope === 'own' }"
        type="button"
        @click="store.setScope('own')"
      >
        Mis movimientos
      </button>
      <button
        v-if="canGlobal"
        class="tab"
        :class="{ active: scope === 'global' }"
        type="button"
        @click="store.setScope('global')"
      >
        Globales
      </button>
    </div>

    <MovementsList />
  </section>
</template>
