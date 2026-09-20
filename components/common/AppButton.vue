<!-- components/common/AppButton.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Button, type ButtonVariants } from '@/components/ui/button'
import { Loader2Icon } from '@lucide/vue'

interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  loading?: boolean
  disabled?: boolean
  to?: string | object
  href?: string
  type?: 'button' | 'submit' | 'reset'
  class?: any
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  loading: false,
  disabled: false,
  type: 'button',
})

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <RouterLink
    v-if="to && !isDisabled"
    :to="to"
    custom
    v-slot="{ href, navigate }"
  >
    <Button
      as="a"
      :href="href"
      :variant="variant"
      :size="size"
      :class="[props.class, customClass]"
      @click="navigate"
    >
      <Loader2Icon v-if="loading" class="animate-spin" />
      <slot />
    </Button>
  </RouterLink>

  <Button
    v-else-if="href && !isDisabled"
    as="a"
    :href="href"
    :variant="variant"
    :size="size"
    :class="[props.class, customClass]"
  >
    <Loader2Icon v-if="loading" class="animate-spin" />
    <slot />
  </Button>

  <Button
    v-else
    :type="type"
    :variant="variant"
    :size="size"
    :disabled="isDisabled"
    :class="[props.class, customClass]"
  >
    <Loader2Icon v-if="loading" class="animate-spin" />
    <slot />
  </Button>
</template>
