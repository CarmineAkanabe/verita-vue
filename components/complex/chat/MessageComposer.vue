<!-- components/complex/chat/MessageComposer.vue -->
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  SendIcon,
  SmileIcon,
  Loader2Icon,
  ShieldCheckIcon,
} from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    isSending?: boolean
  }>(),
  {
    disabled: false,
    isSending: false,
  }
)

const emit = defineEmits<{
  (e: 'send', content: string): void
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
    !props.isSending
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
  <div class="border-t border-[#E2E5EE] bg-white p-3 sm:p-4 space-y-2 relative">
    <!-- Emoji Quick Tray Popover -->
    <div
      v-if="isEmojiPickerOpen"
      class="absolute bottom-full mb-2 left-4 z-20 bg-white border border-[#E2E5EE] rounded-xl shadow-lg p-2.5 flex flex-wrap gap-1.5 max-w-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <button
        v-for="emoji in COMMON_EMOJIS"
        :key="emoji"
        type="button"
        class="h-8 w-8 rounded-lg hover:bg-[#F2F4F7] flex items-center justify-center text-base transition-colors cursor-pointer"
        @click="insertEmoji(emoji)"
      >
        {{ emoji }}
      </button>
    </div>

    <!-- Composer Input Box -->
    <div
      :class="[
        'flex items-end gap-2 p-2 rounded-xl border bg-white transition-colors',
        isOverLimit ? 'border-red-500 ring-1 ring-red-500' : 'border-[#CBD2DF] focus-within:border-[#A2561B] focus-within:ring-1 focus-within:ring-[#A2561B]'
      ]"
    >
      <!-- Emoji Toggle Button -->
      <button
        type="button"
        class="p-2 text-[#6B7280] hover:text-[#A2561B] rounded-lg hover:bg-[#F8F9FA] transition-colors cursor-pointer shrink-0"
        title="Insert Emoji"
        :disabled="disabled"
        @click="isEmojiPickerOpen = !isEmojiPickerOpen"
      >
        <SmileIcon class="size-5" />
      </button>

      <!-- Textarea -->
      <textarea
        ref="textareaRef"
        v-model="content"
        rows="1"
        :placeholder="disabled ? 'Connecting...' : 'Type your confidential message or clarification... (Shift+Enter for new line)'"
        :disabled="disabled"
        class="w-full resize-none bg-transparent py-1.5 px-1 text-xs sm:text-sm text-[#22293A] placeholder-[#6B7280] focus:outline-none min-h-[38px] max-h-[160px] leading-relaxed"
        @input="autoResize"
        @keydown="handleKeyDown"
      ></textarea>

      <!-- Send Button -->
      <button
        type="button"
        class="p-2 rounded-lg bg-[#A2561B] hover:bg-[#843F01] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-xs"
        :disabled="!canSend"
        title="Send Message (Enter)"
        @click="handleSubmit"
      >
        <Loader2Icon v-if="isSending" class="size-4 animate-spin" />
        <SendIcon v-else class="size-4" />
      </button>
    </div>

    <!-- Footer Meta: Policy Notice & Character Counter -->
    <div class="flex items-center justify-between text-[11px] text-[#6B7280] px-1">
      <div class="flex items-center gap-1">
        <ShieldCheckIcon class="size-3 text-[#A2561B]" />
        <span>Text and emojis only. Confidential exhibits must be uploaded to the Evidence Vault.</span>
      </div>

      <div
        :class="[
          'font-mono shrink-0 ml-2',
          isOverLimit ? 'text-red-600 font-bold' : 'text-[#6B7280]'
        ]"
      >
        {{ charCount }} / {{ MAX_CHARS }}
      </div>
    </div>
  </div>
</template>
