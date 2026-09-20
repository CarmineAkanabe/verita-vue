<!-- pages/cases/CaseChat.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { useChatStore } from '@/features/chat/store'

import ChatHeader from '@/components/complex/chat/ChatHeader.vue'
import MessageBubble from '@/components/complex/chat/MessageBubble.vue'
import MessageComposer from '@/components/complex/chat/MessageComposer.vue'

import {
  MessageSquareIcon,
  LockIcon,
  Loader2Icon,
  InfoIcon,
} from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()

const messageScrollRef = ref<HTMLDivElement | null>(null)
const shouldAutoScroll = ref(true)

function scrollToBottom(smooth = false) {
  nextTick(() => {
    const el = messageScrollRef.value
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    })
  })
}

function handleScroll() {
  const el = messageScrollRef.value
  if (!el) return
  // If user scrolled up significantly, do not force auto-scroll
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  shouldAutoScroll.value = distanceFromBottom < 80
}

// Watch incoming messages to auto-scroll if near bottom
watch(
  () => chatStore.messages.length,
  () => {
    if (shouldAutoScroll.value) {
      scrollToBottom(true)
    }
  }
)

async function handleSendMessage(content: string) {
  shouldAutoScroll.value = true
  await chatStore.sendMessage(content)
  scrollToBottom(true)
}

function handleRetryMessage(tempId: string) {
  chatStore.retryMessage(tempId)
}

onMounted(() => {
  if (!authStore.isCaseAuthenticated || !authStore.caseId) {
    router.push({ name: 'case-entry' })
    return
  }

  // Start polling every 3 seconds
  chatStore.startPolling(3000)
  scrollToBottom(false)
})

onUnmounted(() => {
  chatStore.stopPolling()
})
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-[#F2F4F7] text-[#22293A] py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl h-[82vh] min-h-[580px] bg-white border border-[#E2E5EE] rounded-xl shadow-xs flex flex-col overflow-hidden">
      <!-- Consultation Header -->
      <ChatHeader
        :case-id="authStore.caseId || 'UNKNOWN'"
        :department-head="chatStore.departmentHead"
        :is-reconnecting="chatStore.isReconnecting"
      />

      <!-- Message History Scroll Area -->
      <div
        ref="messageScrollRef"
        class="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#F8F9FA]/40"
        @scroll="handleScroll"
      >
        <!-- Initial System Milestone Notice -->
        <div class="text-center my-3">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCF4EE] border border-[#A2561B]/20 text-[11px] font-medium text-[#A2561B]">
            <LockIcon class="size-3 shrink-0" />
            <span>Encrypted investigation channel opened under Digimark internal compliance guidelines</span>
          </div>
        </div>

        <!-- Loading State Skeleton -->
        <div v-if="chatStore.isLoading && !chatStore.hasMessages" class="py-12 space-y-4 max-w-md mx-auto">
          <div class="flex items-center justify-center gap-2 text-xs text-[#6B7280]">
            <Loader2Icon class="size-4 animate-spin text-[#A2561B]" />
            <span>Establishing secure message stream...</span>
          </div>
        </div>

        <!-- Empty Conversation State -->
        <div
          v-else-if="!chatStore.hasMessages"
          class="py-16 px-4 text-center max-w-md mx-auto space-y-3"
        >
          <div class="h-12 w-12 rounded-xl bg-[#FCF4EE] border border-[#A2561B]/30 flex items-center justify-center text-[#A2561B] mx-auto">
            <MessageSquareIcon class="size-6" />
          </div>
          <h3 class="text-sm font-bold text-[#22293A]">
            No Messages Exchanged Yet
          </h3>
          <p class="text-xs text-[#6B7280] leading-relaxed">
            This confidential channel allows you to communicate directly with the assigned supervisor while maintaining total anonymity. Type a message below to begin consultation.
          </p>
          <div class="p-2.5 rounded-lg bg-white border border-[#E2E5EE] text-[11px] text-[#6B7280] inline-flex items-center gap-2 text-left">
            <InfoIcon class="size-4 text-[#A2561B] shrink-0" />
            <span>Messages are accessible only to you and authorized case investigators.</span>
          </div>
        </div>

        <!-- Render Messages -->
        <template v-else>
          <MessageBubble
            v-for="msg in chatStore.messages"
            :key="msg.id || msg.tempId"
            :message="msg"
            :department-head-name="chatStore.departmentHeadName"
            @retry="handleRetryMessage"
          />
        </template>
      </div>

      <!-- Message Composer Area -->
      <MessageComposer
        :is-sending="chatStore.isSending"
        @send="handleSendMessage"
      />
    </div>
  </div>
</template>
