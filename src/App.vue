<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppLayout from '@/shared/layouts/AppLayout.vue'
import AppToasts from '@/shared/components/AppToasts.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import AppLoadingOverlay from '@/shared/components/AppLoadingOverlay.vue'

const route = useRoute()
</script>

<template>
  <RouterView v-slot="{ Component }">
    <AppLayout v-if="!route.meta.public && Component">
      <component :is="Component" />
    </AppLayout>
    <component :is="Component" v-else-if="Component" />
  </RouterView>

  <AppToasts />
  <AppConfirmDialog />
  <AppLoadingOverlay />
</template>
