<!-- components/common/StatusPill.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import {
  ClockIcon,
  SparklesIcon,
  AlertCircleIcon,
  SearchIcon,
  CheckCircle2Icon,
  LockIcon,
  XCircleIcon,
  HelpCircleIcon,
} from '@lucide/vue'

const props = defineProps<{ status: string; size?: 'sm' | 'md' }>()

interface StatusConfig {
  label: string
  icon: any
  classes: string
}

const statusMap: Record<string, StatusConfig> = {
  SUBMITTED: {
    label: 'Submitted',
    icon: ClockIcon,
    classes: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  AI_PROCESSING: {
    label: 'AI Processing',
    icon: SparklesIcon,
    classes: 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse',
  },
  AWAITING_REVIEW: {
    label: 'Awaiting Review',
    icon: AlertCircleIcon,
    classes: 'bg-amber-100/80 text-amber-900 border-amber-400 font-semibold',
  },
  UNDER_INVESTIGATION: {
    label: 'Under Investigation',
    icon: SearchIcon,
    classes: 'bg-sky-50 text-sky-800 border-sky-300',
  },
  RESOLVED: {
    label: 'Resolved',
    icon: CheckCircle2Icon,
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
  },
  CLOSED: {
    label: 'Closed',
    icon: LockIcon,
    classes: 'bg-zinc-100 text-zinc-600 border-zinc-300',
  },
  DISMISSED: {
    label: 'Dismissed',
    icon: XCircleIcon,
    classes: 'bg-rose-50 text-rose-800 border-rose-300',
  },
}

const current = computed<StatusConfig>(() => {
  const norm = props.status?.toUpperCase() || ''
  return (
    statusMap[norm] ?? {
      label: props.status?.replaceAll('_', ' ') || 'Unknown',
      icon: HelpCircleIcon,
      classes: 'bg-slate-100 text-slate-700 border-slate-300',
    }
  )
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium select-none shadow-2xs"
    :class="[
      current.classes,
      size === 'sm' ? 'text-[10px] py-0.2 px-2' : 'text-xs',
    ]"
    :title="`Case status: ${current.label}`"
  >
    <component :is="current.icon" class="size-3.5 shrink-0" aria-hidden="true" />
    <span>{{ current.label }}</span>
  </span>
</template>