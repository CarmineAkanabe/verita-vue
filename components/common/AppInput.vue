<!-- components/common/AppInput.vue -->
<script setup lang="ts">
import { ref, useId, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EyeIcon, EyeOffIcon } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    label?: string
    id?: string
    type?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    error?: string
    hint?: string
    autocomplete?: string
    inputClass?: string
  }>(),
  {
    type: 'text',
    required: false,
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const generatedId = useId()
const inputId = computed(() => props.id || `input-${generatedId}`)
const showPassword = ref(false)

const computedType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="space-y-1.5 text-left">
    <!-- Label -->
    <div v-if="label" class="flex items-center justify-between">
      <Label :for="inputId" class="text-xs font-semibold text-foreground flex items-center gap-1">
        <span>{{ label }}</span>
        <span v-if="required" class="text-destructive font-bold">*</span>
      </Label>
      <slot name="label-extra" />
    </div>

    <!-- Input Field Container -->
    <div class="relative">
      <div
        v-if="$slots.prefix"
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground"
      >
        <slot name="prefix" />
      </div>

      <Input
        :id="inputId"
        :type="computedType"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined"
        :class="[
          $slots.prefix ? 'pl-9' : '',
          props.type === 'password' || $slots.suffix ? 'pr-10' : '',
          error ? 'border-destructive focus-visible:ring-destructive/30' : '',
          inputClass,
        ]"
        @input="onInput"
      />

      <!-- Password visibility toggle -->
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
        tabindex="-1"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        @click="showPassword = !showPassword"
      >
        <EyeOffIcon v-if="showPassword" class="size-4" />
        <EyeIcon v-else class="size-4" />
      </button>

      <!-- Custom Suffix Slot (when not password) -->
      <div
        v-else-if="$slots.suffix"
        class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground"
      >
        <slot name="suffix" />
      </div>
    </div>

    <!-- Error Message -->
    <p
      v-if="error"
      :id="`${inputId}-error`"
      class="text-[11px] font-medium text-destructive leading-tight flex items-center gap-1 mt-1"
    >
      <span>{{ error }}</span>
    </p>

    <!-- Helper / Hint Text -->
    <p
      v-else-if="hint"
      :id="`${inputId}-hint`"
      class="text-[11px] text-muted-foreground leading-tight mt-1"
    >
      {{ hint }}
    </p>
  </div>
</template>
