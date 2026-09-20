<!-- components/common/AppSelect.vue -->
<script setup lang="ts">
import { useId, computed } from 'vue'
import { Label } from '@/components/ui/label'
import { ChevronDownIcon } from '@lucide/vue'

export interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    id?: string
    options: SelectOption[]
    placeholder?: string
    required?: boolean
    disabled?: boolean
    error?: string
    hint?: string
    selectClass?: string
  }>(),
  {
    modelValue: '',
    required: false,
    disabled: false,
    placeholder: 'Select an option...',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const generatedId = useId()
const selectId = computed(() => props.id || `select-${generatedId}`)

function onChange(e: Event) {
  const target = e.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="space-y-1.5 text-left">
    <!-- Label -->
    <div v-if="label" class="flex items-center justify-between">
      <Label :for="selectId" class="text-xs font-semibold text-foreground flex items-center gap-1">
        <span>{{ label }}</span>
        <span v-if="required" class="text-destructive font-bold">*</span>
      </Label>
      <slot name="label-extra" />
    </div>

    <!-- Select Field Container -->
    <div class="relative">
      <div
        v-if="$slots.prefix"
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground"
      >
        <slot name="prefix" />
      </div>

      <select
        :id="selectId"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined"
        class="flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 pr-9 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 cursor-pointer"
        :class="[
          $slots.prefix ? 'pl-9' : '',
          error ? 'border-destructive focus-visible:ring-destructive/30' : '',
          !modelValue ? 'text-muted-foreground' : 'text-foreground',
          selectClass,
        ]"
        @change="onChange"
      >
        <option value="" disabled class="text-muted-foreground bg-background">
          {{ placeholder }}
        </option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          class="text-foreground bg-background py-1"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- Chevron Icon -->
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">
        <ChevronDownIcon class="size-4" />
      </div>
    </div>

    <!-- Error Message -->
    <p
      v-if="error"
      :id="`${selectId}-error`"
      class="text-[11px] font-medium text-destructive leading-tight flex items-center gap-1 mt-1"
    >
      <span>{{ error }}</span>
    </p>

    <!-- Helper / Hint Text -->
    <p
      v-else-if="hint"
      :id="`${selectId}-hint`"
      class="text-[11px] text-muted-foreground leading-tight mt-1"
    >
      {{ hint }}
    </p>
  </div>
</template>
