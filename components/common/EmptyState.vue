<!-- components/common/EmptyState.vue -->
<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>
<template>
  <div class="flex flex-col items-center justify-center text-center py-12 gap-2">
    <slot name="icon" />
    <p class="font-medium">{{ title }}</p>
    <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
    <slot name="action" />
  </div>
</template>