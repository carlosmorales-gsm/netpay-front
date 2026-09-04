import { ref } from 'vue'
import { defineStore } from 'pinia'
import { empresasApi } from '@/shared/api/empresas.api'
import type { Empresa } from '@/shared/types/empresa'

export type { Empresa }

export const useEmpresasStore = defineStore('empresas', () => {
  const items = ref<Empresa[]>([])
  const loaded = ref(false)

  async function fetchAll() {
    try {
      const { data } = await empresasApi.list()
      items.value = data
      loaded.value = true
    } catch {
      items.value = []
    }
  }

  function nombre(id: number | string | null | undefined) {
    if (id == null || id === '') return '—'
    const num = Number(id)
    if (!Number.isFinite(num)) return '—'
    return items.value.find((e) => Number(e.id) === num)?.nombre ?? '—'
  }

  return { items, loaded, fetchAll, nombre }
})
