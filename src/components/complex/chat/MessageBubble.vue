<!-- components/complex/chat/MessageBubble.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage } from '@/features/chat/types'
import {
  CheckCheckIcon,
  Loader2Icon,
  AlertCircleIcon,
  RotateCcwIcon,
  ShieldIcon,
  UserIcon,
} from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    message: ChatMessage
    departmentHeadName?: string
    reporterLabel?: string
    viewer?: 'REPORTER' | 'STAFF'
  }>(),
  {
    viewer: 'REPORTER',
  }
)

const emit = defineEmits<{
  (e: 'retry', tempId: string): void
}>()

const isOutgoing = computed(() => {
  if (props.viewer === 'STAFF') {
    return props.message.senderType === 'DEPARTMENT_HEAD'
  }
  return props.message.senderType === 'CASE_REPORTER'
})

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
</script>

<template>
  <div :class="[
    'flex w-full my-1.5 sm:my-2 px-1 sm:px-2',
    isOutgoing ? 'justify-end' : 'justify-start'
  ]">
    <!-- Bubble Container -->
    <div :class="[
      'max-w-[88%] sm:max-w-[76%] md:max-w-[65%] flex flex-col',
      isOutgoing ? 'items-end' : 'items-start'
    ]">
      <!-- The Speech Bubble Card -->
      <div :class="[
        'relative px-3.5 py-2.5 sm:px-4 sm:py-2.5 text-[13.5px] sm:text-sm leading-relaxed break-words whitespace-pre-wrap transition-shadow',
        isOutgoing
          ? 'bg-gradient-to-br from-[#A2561B] to-[#914611] text-white rounded-2xl rounded-tr-xs shadow-[0_1px_3px_rgba(162,86,27,0.22)]'
          : 'bg-[#FFFDFB] text-foreground rounded-2xl rounded-tl-xs border border-[#E4DDD3] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
      ]">
        <!-- Incoming Sender Identity Header (WhatsApp group / counter-party style) -->
        <div v-if="!isOutgoing" class="flex items-center gap-1.5 mb-1 pb-1 border-b border-border/50">
          <template v-if="viewer === 'STAFF'">
            <ShieldIcon class="size-3 text-primary shrink-0" />
            <span class="text-xs font-bold text-primary">{{ reporterLabel || 'Case Reporter' }}</span>
            <span class="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#FCF4EE] border border-primary/20 text-primary">
              Anonymous
            </span>
          </template>
          <template v-else>
            <UserIcon class="size-3 text-foreground shrink-0" />
            <span class="text-xs font-bold text-foreground">{{ departmentHeadName || 'Department Head' }}</span>
            <span class="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#F4EFE6] border border-border text-muted-foreground">
              Investigator
            </span>
          </template>
        </div>

        <!-- Message Body Text -->
        <p class="inline mr-2">{{ message.content }}</p>

        <!-- Inline Embedded WhatsApp-Style Time & Status Anchor -->
        <span class="inline-flex items-center gap-1 float-right translate-y-1 select-none pointer-events-auto">
          <!-- Timestamp -->
          <span :class="[
            'text-[10px] font-medium tracking-tight',
            isOutgoing ? 'text-white/80' : 'text-[#8A8F9E]'
          ]">
            {{ formatTime(message.sentAt) }}
          </span>

          <!-- Outgoing delivery telemetry indicators -->
          <template v-if="isOutgoing">
            <!-- Pending / In-flight -->
            <span v-if="message.status === 'pending'" class="inline-flex items-center text-white/80" title="Transmitting...">
              <Loader2Icon class="size-2.5 animate-spin" />
            </span>

            <!-- Failed Delivery with Retry action -->
            <span v-else-if="message.status === 'failed'" class="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded text-[9.5px] font-bold text-red-100">
              <AlertCircleIcon class="size-3 text-red-200" />
              <span>Failed</span>
              <button
                type="button"
                class="underline hover:text-white inline-flex items-center gap-0.5 cursor-pointer ml-0.5"
                title="Retry message sending"
                @click="emit('retry', message.tempId || message.id)"
              >
                <RotateCcwIcon class="size-2.5" />
                <span>Retry</span>
              </button>
            </span>

            <!-- Confirmed / Delivered (Double Check like WhatsApp) -->
            <span v-else class="inline-flex items-center text-amber-200" title="Delivered via secure channel">
              <CheckCheckIcon class="size-3.5" />
            </span>
          </template>
        </span>
      </div>
    </div>
  </div>
</template>

