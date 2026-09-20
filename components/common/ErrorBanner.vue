
<script setup lang="ts">
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
defineProps<{ title?: string; message: string; retryable?: boolean }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <Alert variant="destructive">
    <AlertTitle>{{ title ?? 'Something went wrong' }}</AlertTitle>
    <AlertDescription class="flex items-center justify-between gap-4">
      <span>{{ message }}</span>
      <button v-if="retryable" class="underline text-sm" @click="$emit('retry')">Retry</button>
    </AlertDescription>
  </Alert>
</template>