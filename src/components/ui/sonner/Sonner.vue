<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from "@lucide/vue"
import { Toaster as Sonner } from "vue-sonner"

const props = withDefaults(defineProps<ToasterProps>(), {
  position: 'top-right',
  richColors: true,
  closeButton: true,
})
</script>

<template>
  <Sonner
    class="toaster group"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
    }"
    v-bind="props"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4 text-emerald-600" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4 text-sky-600" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4 text-amber-600" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4 text-rose-600" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin text-primary" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>
