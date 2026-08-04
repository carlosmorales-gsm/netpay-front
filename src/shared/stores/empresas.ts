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

  function nombre(id: number | null | undefined) {
    if (id == null) return '—'
    return items.value.find((e) => e.id === id)?.nombre ?? String(id)
  }

  return { items, loaded, fetchAll, nombre }
})
