<!-- components/common/ErrorBanner.vue -->
<script setup lang="ts">
import { AlertCircleIcon, RefreshCwIcon } from '@lucide/vue'

defineProps<{
  title?: string
  message: string
  retryable?: boolean
}>()

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div
    role="alert"
    class="rounded-xl border border-rose-300 bg-rose-50/80 p-4 text-rose-950 shadow-2xs transition-all animate-fade-in"
  >
    <div class="flex items-start gap-3">
      <AlertCircleIcon class="size-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-bold text-rose-900">
          {{ title ?? 'Something went wrong' }}
        </h4>
        <p class="text-xs text-rose-700 mt-0.5 leading-relaxed">
          {{ message }}
        </p>
      </div>
      <button
        v-if="retryable"
        type="button"
        class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 hover:text-rose-900 transition-colors shadow-2xs cursor-pointer"
        @click="$emit('retry')"
      >
        <RefreshCwIcon class="size-3" />
        Retry
      </button>
    </div>
  </div>
</template>