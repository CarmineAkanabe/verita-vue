<!-- components/complex/chat/MessageBubble.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage } from '@/features/chat/types'
import {
  CheckIcon,
  Loader2Icon,
  AlertCircleIcon,
  RotateCcwIcon,
  ShieldIcon,
  UserIcon,
} from '@lucide/vue'

const props = defineProps<{
  message: ChatMessage
  departmentHeadName?: string
}>()

const emit = defineEmits<{
  (e: 'retry', tempId: string): void
}>()

const isReporter = computed(() => props.message.senderType === 'CASE_REPORTER')

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
  <div
    :class="[
      'flex w-full my-2',
      isReporter ? 'justify-end' : 'justify-start'
    ]"
  >
    <!-- Message Container with Max Width -->
    <div
      :class="[
        'max-w-[85%] sm:max-w-[70%] flex flex-col',
        isReporter ? 'items-end' : 'items-start'
      ]"
    >
      <!-- Sender Meta Label -->
      <div class="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-semibold text-[#6B7280]">
        <template v-if="isReporter">
          <ShieldIcon class="size-3 text-[#A2561B]" />
          <span>You (Anonymous Reporter)</span>
        </template>
        <template v-else>
          <UserIcon class="size-3 text-[#575E71]" />
          <span class="text-[#22293A]">{{ departmentHeadName || 'Department Head' }}</span>
          <span class="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#F2F4F7] border border-[#E2E5EE] text-[#575E71]">
            Investigator
          </span>
        </template>
      </div>

      <!-- Bubble -->
      <div
        :class="[
          'px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs break-words whitespace-pre-wrap',
          isReporter
            ? 'bg-[#A2561B] text-white rounded-tr-xs border border-[#843F01]/30'
            : 'bg-white text-[#22293A] rounded-tl-xs border border-[#E2E5EE]'
        ]"
      >
        {{ message.content }}
      </div>

      <!-- Timestamp and Delivery Status Footer -->
      <div
        :class="[
          'flex items-center gap-1.5 mt-1 px-1 text-[10px]',
          isReporter ? 'text-[#6B7280]' : 'text-[#6B7280]'
        ]"
      >
        <span>{{ formatTime(message.sentAt) }}</span>

        <!-- Reporter status tags -->
        <template v-if="isReporter">
          <span v-if="message.status === 'pending'" class="inline-flex items-center gap-1 text-[#A2561B]">
            <Loader2Icon class="size-2.5 animate-spin" />
            <span>Transmitting...</span>
          </span>

          <span v-else-if="message.status === 'failed'" class="inline-flex items-center gap-1 text-red-600">
            <AlertCircleIcon class="size-3 text-red-600" />
            <span>Failed</span>
            <button
              type="button"
              class="underline font-semibold hover:text-red-800 ml-1 inline-flex items-center gap-0.5 cursor-pointer"
              @click="emit('retry', message.tempId || message.id)"
            >
              <RotateCcwIcon class="size-2.5" />
              <span>Retry</span>
            </button>
          </span>

          <span v-else class="inline-flex items-center text-emerald-600">
            <CheckIcon class="size-3" />
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
