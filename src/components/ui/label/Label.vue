<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { Label as RadixLabel, type LabelProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<LabelProps & { class?: HTMLAttributes["class"] }>()
</script>

<template>
  <RadixLabel
    v-bind="props"
    data-slot="label"
    :class="
      cn(
        'text-sm font-medium leading-none text-foreground select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        props.class,
      )
    "
  >
    <slot />
  </RadixLabel>
</template>
