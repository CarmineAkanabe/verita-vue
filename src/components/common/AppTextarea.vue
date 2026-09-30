<!-- components/common/AppTextarea.vue -->
<script setup lang="ts">
import { useId, computed } from 'vue'
import { Label } from '@/components/ui/label'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    id?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    error?: string
    hint?: string
    rows?: number
    maxlength?: number
    textareaClass?: string
  }>(),
  {
    modelValue: '',
    required: false,
    disabled: false,
    rows: 4,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const generatedId = useId()
const textareaId = computed(() => props.id || `textarea-${generatedId}`)
const currentLength = computed(() => (props.modelValue ? props.modelValue.length : 0))

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="space-y-1.5 text-left">
    <!-- Header: Label + Character Counter -->
    <div class="flex items-center justify-between">
      <Label v-if="label" :for="textareaId" class="text-xs font-semibold text-foreground flex items-center gap-1">
        <span>{{ label }}</span>
        <span v-if="required" class="text-destructive font-bold">*</span>
      </Label>
      <div v-if="maxlength" class="text-[11px] font-mono text-muted-foreground">
        {{ currentLength }} / {{ maxlength }}
      </div>
    </div>

    <!-- Textarea Element -->
    <textarea
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      :maxlength="maxlength"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined"
      class="placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-base sm:text-xs shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 aria-invalid:ring-destructive/20 aria-invalid:border-destructive text-foreground"
      :class="[
        error ? 'border-destructive focus-visible:ring-destructive/30' : '',
        textareaClass,
      ]"
      @input="onInput"
    />

    <!-- Error Message -->
    <p
      v-if="error"
      :id="`${textareaId}-error`"
      class="text-[11px] font-medium text-destructive leading-tight flex items-center gap-1 mt-1"
    >
      <span>{{ error }}</span>
    </p>

    <!-- Helper / Hint Text -->
    <p
      v-else-if="hint"
      :id="`${textareaId}-hint`"
      class="text-[11px] text-muted-foreground leading-tight mt-1"
    >
      {{ hint }}
    </p>
  </div>
</template>
