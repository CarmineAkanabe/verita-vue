<!-- components/complex/chat/MessageComposer.vue -->
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  SendIcon,
  SmileIcon,
  Loader2Icon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
} from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    isSending?: boolean
    isSocketConnected?: boolean
  }>(),
  {
    disabled: false,
    isSending: false,
    isSocketConnected: true,
  }
)

const emit = defineEmits<{
  (e: 'send', content: string): void
  (e: 'reconnect'): void
}>()

const content = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isEmojiPickerOpen = ref(false)

const MAX_CHARS = 2000

const charCount = computed(() => content.value.length)
const isOverLimit = computed(() => charCount.value > MAX_CHARS)
const canSend = computed(
  () =>
    content.value.trim().length > 0 &&
    !isOverLimit.value &&
    !props.disabled &&
    !props.isSending &&
    props.isSocketConnected
)

// Standard emoji tray
const COMMON_EMOJIS = [
  '👍', '🙏', '✅', '⚠️', '📄', '💼', '🔍', '⏳', '🤝', '💡', '❓', '❌'
]

function insertEmoji(emoji: string) {
  const el = textareaRef.value
  if (!el) {
    content.value += emoji
    return
  }

  const start = el.selectionStart || content.value.length
  const end = el.selectionEnd || content.value.length
  const before = content.value.substring(0, start)
  const after = content.value.substring(end)

  content.value = before + emoji + after

  nextTick(() => {
    el.focus()
    const newPos = start + emoji.length
    el.setSelectionRange(newPos, newPos)
  })
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

function handleSubmit() {
  if (!canSend.value) return
  emit('send', content.value)
  content.value = ''
  isEmojiPickerOpen.value = false

  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.focus()
    }
  })
}

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}
</script>

<template>
  <div class="border-t border-[#DED6C9] bg-[#F7F4ED] p-3 sm:p-3.5 space-y-2 relative">
    <!-- WebSocket Offline Warning Strip -->
    <div
      v-if="!isSocketConnected"
      class="p-2.5 rounded-xl bg-[#FFF6E9] border border-[#F8D7A6] text-[#8C430E] text-xs flex items-center justify-between gap-2 shadow-2xs"
    >
      <div class="flex items-center gap-1.5 font-medium">
        <AlertTriangleIcon class="size-4 shrink-0 text-[#C05621]" />
        <span>Real-time channel offline (Reverb is not running). Connect WebSocket to send.</span>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#A2561B] hover:bg-[#8C430E] text-white text-[11px] font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
        @click="emit('reconnect')"
      >
        <RefreshCwIcon class="size-3" />
        <span>Reconnect</span>
      </button>
    </div>

    <!-- Emoji Quick Tray Popover -->
    <div
      v-if="isEmojiPickerOpen"
      class="absolute bottom-full mb-2 left-4 z-20 bg-white border border-[#E2D5C3] rounded-2xl shadow-xl p-2.5 flex flex-wrap gap-1.5 max-w-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <button
        v-for="emoji in COMMON_EMOJIS"
        :key="emoji"
        type="button"
        class="h-8 w-8 rounded-lg hover:bg-[#F4EFE6] flex items-center justify-center text-base transition-colors cursor-pointer"
        @click="insertEmoji(emoji)"
      >
        {{ emoji }}
      </button>
    </div>

    <!-- Composer Input Box with WhatsApp Geometry -->
    <div class="flex items-end gap-2">
      <!-- Input Capsule -->
      <div
        :class="[
          'flex-1 flex items-end gap-1.5 px-3 py-1.5 rounded-2xl bg-white border shadow-xs transition-colors',
          isOverLimit
            ? 'border-red-500 ring-1 ring-red-500'
            : !isSocketConnected
            ? 'border-[#E0D8CB] bg-[#FAF8F5]'
            : 'border-[#D5CDC0] focus-within:border-[#A2561B] focus-within:ring-2 focus-within:ring-[#A2561B]/15'
        ]"
      >
        <!-- Emoji Toggle Button -->
        <button
          type="button"
          class="p-1.5 text-[#6B7280] hover:text-[#A2561B] rounded-lg hover:bg-[#F8F5EE] transition-colors cursor-pointer shrink-0"
          title="Insert Emoji"
          :disabled="disabled || !isSocketConnected"
          @click="isEmojiPickerOpen = !isEmojiPickerOpen"
        >
          <SmileIcon class="size-5" />
        </button>

        <!-- Auto-expanding Textarea -->
        <textarea
          ref="textareaRef"
          v-model="content"
          rows="1"
          :placeholder="
            !isSocketConnected
              ? 'WebSocket offline. Connect Reverb to transmit messages...'
              : disabled
              ? 'Connecting...'
              : 'Type a message... (Shift+Enter for new line)'
          "
          :disabled="disabled || !isSocketConnected"
          class="w-full resize-none bg-transparent py-1.5 px-1 text-xs sm:text-sm text-[#22293A] placeholder-[#8A8F9E] focus:outline-none min-h-[38px] max-h-[160px] leading-relaxed disabled:opacity-50"
          @input="autoResize"
          @keydown="handleKeyDown"
        ></textarea>
      </div>

      <!-- Circular WhatsApp-Style Send Button -->
      <button
        type="button"
        class="h-11 w-11 rounded-full bg-[#A2561B] hover:bg-[#8C430E] text-white flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-sm"
        :disabled="!canSend"
        :title="!isSocketConnected ? 'WebSocket offline' : 'Send Message (Enter)'"
        @click="handleSubmit"
      >
        <Loader2Icon v-if="isSending" class="size-5 animate-spin" />
        <SendIcon v-else class="size-5 translate-x-0.5" />
      </button>
    </div>

    <!-- Footer Meta: Policy Notice & Character Counter -->
    <div class="flex items-center justify-between text-[11px] text-[#787D8A] px-1 pt-0.5">
      <div class="flex items-center gap-1">
        <ShieldCheckIcon class="size-3 text-[#A2561B]" />
        <span>Text &amp; emojis only. Confidential documents must be added to Evidence Vault.</span>
      </div>

      <div
        :class="[
          'font-mono shrink-0 ml-2',
          isOverLimit ? 'text-red-600 font-bold' : 'text-[#787D8A]'
        ]"
      >
        {{ charCount }} / {{ MAX_CHARS }}
      </div>
    </div>
  </div>
</template>

