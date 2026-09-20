<!-- components/common/AppCard.vue -->
<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

defineProps<{
  title?: string
  description?: string
  cardClass?: string
  headerClass?: string
  contentClass?: string
  footerClass?: string
}>()
</script>

<template>
  <Card :class="cardClass">
    <CardHeader v-if="title || description || $slots.header || $slots.action" :class="headerClass">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1 w-full">
          <slot name="header">
            <CardTitle v-if="title">{{ title }}</CardTitle>
            <CardDescription v-if="description">{{ description }}</CardDescription>
          </slot>
        </div>
        <div v-if="$slots.action" class="shrink-0">
          <slot name="action" />
        </div>
      </div>
    </CardHeader>
    <CardContent :class="contentClass">
      <slot />
    </CardContent>
    <CardFooter v-if="$slots.footer" :class="footerClass">
      <slot name="footer" />
    </CardFooter>
  </Card>
</template>
