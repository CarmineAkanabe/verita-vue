<script setup lang="ts">
import { Toaster } from '@/plugins/toast'
</script>

<template>
  <router-view />
  <Toaster position="top-right" :rich-colors="true" :expand="true" close-button />
</template>