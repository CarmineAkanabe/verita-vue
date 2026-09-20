
<script setup lang="ts">
defineProps<{ code?: number }>()
</script>
<template>
  <div class="text-center space-y-4">
    <p class="text-6xl font-bold text-primary">{{ code ?? 404 }}</p>
    <p class="text-muted-foreground">This page doesn't exist.</p>
    <router-link to="/" class="underline text-sm">Back to safety</router-link>
  </div>
</template>