
<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
const props = defineProps<{ status: string }>()
const tone: Record<string, 'default' | 'secondary' | 'destructive'> = {
  SUBMITTED: 'secondary', AI_PROCESSING: 'secondary', AWAITING_REVIEW: 'default',
  UNDER_INVESTIGATION: 'default', RESOLVED: 'default', CLOSED: 'secondary', DISMISSED: 'destructive',
}
</script>
<template>
  <Badge :variant="tone[props.status] ?? 'secondary'">{{ props.status.replaceAll('_', ' ') }}</Badge>
</template>