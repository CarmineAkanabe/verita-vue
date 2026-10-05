<script setup lang="ts">
import { computed } from 'vue'
import type { ResolutionTrendItem } from '@/features/manager/types'

const props = defineProps<{
  data: ResolutionTrendItem[]
}>()

const width = 600
const height = 220
const padding = { top: 25, right: 20, bottom: 35, left: 40 }

const chartWidth = width - padding.left - padding.right
const chartHeight = height - padding.top - padding.bottom

const rawMax = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  return Math.max(...props.data.flatMap(d => [d.resolved, d.dismissed]))
})

const maxValue = computed(() => {
  const m = rawMax.value
  if (m <= 2) return 4
  const ceiling = Math.ceil(m * 1.2)
  return ceiling % 2 === 0 ? ceiling : ceiling + 1
})

const points = computed(() => {
  if (!props.data || props.data.length === 0) return []
  const stepX = props.data.length > 1 ? chartWidth / (props.data.length - 1) : chartWidth
  
  return props.data.map((d, i) => {
    const x = padding.left + i * stepX
    const resolvedY = padding.top + chartHeight - (d.resolved / maxValue.value) * chartHeight
    const dismissedY = padding.top + chartHeight - (d.dismissed / maxValue.value) * chartHeight
    
    return {
      x,
      resolvedY,
      dismissedY,
      resolved: d.resolved,
      dismissed: d.dismissed,
      month: d.month
    }
  })
})

const resolvedPath = computed(() => {
  if (points.value.length === 0) return ''
  return points.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.resolvedY}`).join(' ')
})

const dismissedPath = computed(() => {
  if (points.value.length === 0) return ''
  return points.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.dismissedY}`).join(' ')
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length >= 3) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    const d = new Date(year, month, day)
    return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
  } else if (parts.length === 2) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const d = new Date(year, month, 1)
    return d.toLocaleDateString('en-GB', { month: 'short' })
  }
  return dateStr
}
</script>

<template>
  <div class="relative w-full overflow-hidden font-mono">
    <div v-if="!data || data.length === 0" class="flex items-center justify-center h-48 text-muted-foreground text-xs">
      No trend data available.
    </div>
    
    <svg v-else :viewBox="`0 0 ${width} ${height}`" class="w-full h-auto drop-shadow-sm">
      <!-- Grid Lines -->
      <g stroke="currentColor" stroke-dasharray="4,4" class="text-border" opacity="0.4">
        <line :x1="padding.left" :y1="padding.top" :x2="width - padding.right" :y2="padding.top" />
        <line :x1="padding.left" :y1="padding.top + chartHeight / 2" :x2="width - padding.right" :y2="padding.top + chartHeight / 2" />
        <line :x1="padding.left" :y1="padding.top + chartHeight" :x2="width - padding.right" :y2="padding.top + chartHeight" />
      </g>

      <!-- Y Axis Labels -->
      <g class="text-[10px] text-muted-foreground fill-current" text-anchor="end">
        <text :x="padding.left - 10" :y="padding.top + 3">{{ Math.round(maxValue) }}</text>
        <text :x="padding.left - 10" :y="padding.top + chartHeight / 2 + 3">{{ Math.round(maxValue / 2) }}</text>
        <text :x="padding.left - 10" :y="padding.top + chartHeight + 3">0</text>
      </g>

      <!-- X Axis Labels -->
      <g class="text-[10px] text-muted-foreground fill-current" text-anchor="middle">
        <text v-for="(p, i) in points" :key="`x-${i}`" :x="p.x" :y="height - 15">
          {{ formatDate(p.month) }}
        </text>
      </g>

      <!-- Resolved Line -->
      <path :d="resolvedPath" fill="none" stroke="currentColor" stroke-width="2.5" class="text-emerald-500 drop-shadow-sm transition-all duration-700" />
      <!-- Dismissed Line -->
      <path :d="dismissedPath" fill="none" stroke="currentColor" stroke-width="2.5" class="text-rose-500 drop-shadow-sm transition-all duration-700" />

      <!-- Data Points -->
      <g v-for="(p, i) in points" :key="`pt-${i}`">
        <!-- Resolved point -->
        <circle :cx="p.x" :cy="p.resolvedY" r="4.5" class="fill-white stroke-emerald-500" stroke-width="2.5" />
        <text v-if="p.resolved > 0" :x="p.x" :y="p.resolvedY - 12" text-anchor="middle" class="text-[10px] font-bold fill-emerald-600">{{ p.resolved }}</text>
        
        <!-- Dismissed point (slightly smaller radius to show concentric if overlapping) -->
        <circle :cx="p.x" :cy="p.dismissedY" r="3.5" class="fill-white stroke-rose-500" stroke-width="2" />
        <text v-if="p.dismissed > 0" :x="p.x" :y="p.dismissedY + 18" text-anchor="middle" class="text-[10px] font-bold fill-rose-600">{{ p.dismissed }}</text>
      </g>
    </svg>
    
    <!-- Legend -->
    <div class="flex items-center justify-center gap-5 mt-1 text-xs font-bold text-muted-foreground">
      <div class="flex items-center gap-2">
        <span class="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm border border-emerald-600"></span>
        Resolved
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm border border-rose-600"></span>
        Dismissed
      </div>
    </div>
  </div>
</template>
