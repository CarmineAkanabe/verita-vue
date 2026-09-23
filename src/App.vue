<script setup lang="ts">
import { Toaster } from '@/plugins/toast'
import NetworkStatusBanner from '@/components/common/NetworkStatusBanner.vue'
</script>

<template>
  <NetworkStatusBanner />
  <router-view />
  <Toaster position="top-right" :rich-colors="true" :expand="true" close-button />
</template>