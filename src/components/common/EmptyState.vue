<!-- components/common/EmptyState.vue -->
<script setup lang="ts">
import { InboxIcon } from '@lucide/vue'

defineProps<{
  title: string
  description?: string
  bordered?: boolean
  creamy?: boolean
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center py-12 px-6 rounded-xl transition-all"
    :class="[
      creamy ? 'bg-card border border-border' : bordered ? 'bg-card border border-border' : '',
    ]"
  >
    <div class="size-12 rounded-xl bg-white/80 border border-border flex items-center justify-center text-muted-foreground shadow-2xs mb-3">
      <slot name="icon">
        <InboxIcon class="size-6 text-muted-foreground/70" />
      </slot>
    </div>

    <h3 class="font-bold text-foreground text-base sm:text-lg tracking-tight">
      {{ title }}
    </h3>

    <p v-if="description" class="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 leading-relaxed">
      {{ description }}
    </p>

    <div v-if="$slots.action" class="mt-5 flex items-center justify-center gap-3">
      <slot name="action" />
    </div>
  </div>
</template>