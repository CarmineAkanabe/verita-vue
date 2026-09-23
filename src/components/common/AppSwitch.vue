<!-- components/common/AppSwitch.vue -->
<script setup lang="ts">
import { useId, computed } from 'vue'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    id?: string
    label: string
    description?: string
    badge?: string
    disabled?: boolean
  }>(),
  {
    modelValue: false,
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const generatedId = useId()
const switchId = computed(() => props.id || `switch-${generatedId}`)
</script>

<template>
  <div class="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-card">
    <div class="space-y-1 pr-2">
      <div class="flex items-center gap-2">
        <Label :for="switchId" class="text-sm font-semibold text-foreground cursor-pointer">
          {{ label }}
        </Label>
        <span
          v-if="badge"
          class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-warning/10 text-warning border border-warning/20"
        >
          {{ badge }}
        </span>
      </div>
      <p v-if="description" class="text-xs text-muted-foreground leading-relaxed">
        {{ description }}
      </p>
    </div>

    <Switch
      :id="switchId"
      :checked="modelValue"
      :disabled="disabled"
      class="mt-0.5 shrink-0"
      @update:checked="(val: boolean) => emit('update:modelValue', val)"
    />
  </div>
</template>
