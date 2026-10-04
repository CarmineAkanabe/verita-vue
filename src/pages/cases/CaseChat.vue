<!-- pages/cases/CaseChat.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { useChatStore } from '@/features/chat/store'
import { caseToken } from '@/shared/api/auth'

import ChatHeader from '@/components/complex/chat/ChatHeader.vue'
import MessageBubble from '@/components/complex/chat/MessageBubble.vue'
import MessageComposer from '@/components/complex/chat/MessageComposer.vue'

import {
  MessageSquareIcon,
  LockIcon,
  Loader2Icon,
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

function handleReconnect() {
  chatStore.reconnect()
}

onMounted(() => {
  const token = caseToken.get()
  if (!authStore.isCaseAuthenticated || !authStore.caseId || !token) {
    router.push({ name: 'case-entry' })
    return
  }

  // Loads history, then opens the live connection
  chatStore.start('REPORTER', authStore.caseId, token)
  scrollToBottom(false)
})

onUnmounted(() => {
  chatStore.stop()
})
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-[#F4EFE6] text-foreground py-3 sm:py-6 px-2 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl h-[84vh] min-h-[580px] bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
      <!-- Consultation Header with Live Socket Connection Status -->
      <ChatHeader
        :case-id="authStore.caseId || 'UNKNOWN'"
        :department-head="chatStore.departmentHead"
        :is-reconnecting="chatStore.isReconnecting"
        :is-socket-connected="chatStore.isSocketConnected"
        :socket-status="chatStore.socketStatus"
        viewer="REPORTER"
        @reconnect="handleReconnect"
      />

      <!-- WhatsApp-Style Wallpaper Scroll Area -->
      <div
        ref="messageScrollRef"
        class="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 chat-wallpaper-whatsapp chat-scrollbar"
        role="log"
        aria-live="polite"
        aria-label="Conversation messages"
        @scroll="handleScroll"
      >
        <!-- Privacy notice banner -->
        <div class="text-center my-2 sm:my-3">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFF9EE]/90 backdrop-blur-xs border border-border text-xs font-medium text-[#8C5D39] shadow-2xs max-w-lg mx-auto">
            <LockIcon class="size-3.5 shrink-0 text-primary" />
            <span>Your messages are private and stay inside this case. Your identity is never shown.</span>
          </div>
        </div>

        <!-- Loading State Skeleton -->
        <div v-if="chatStore.isLoading && !chatStore.hasMessages" class="py-12 space-y-4 max-w-md mx-auto">
          <div class="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2Icon class="size-4 animate-spin text-primary" />
            <span>Connecting to confidential consultation stream...</span>
          </div>
        </div>

        <!-- Empty Conversation State -->
        <div
          v-else-if="!chatStore.hasMessages"
          class="py-16 px-4 text-center max-w-md mx-auto space-y-3 bg-[#FFFDF9]/90 backdrop-blur-xs rounded-2xl border border-border shadow-2xs my-6"
        >
          <div class="h-12 w-12 rounded-xl bg-[#FCF4EE] border border-primary/30 flex items-center justify-center text-primary mx-auto">
            <MessageSquareIcon class="size-6" />
          </div>
          <h3 class="text-sm font-bold text-foreground">
            Confidential Consultation Ready
          </h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            This encrypted channel connects you with the assigned investigator while keeping your identity strictly anonymous. Messages travel exclusively across the secure real-time stream.
          </p>
        </div>

        <!-- Render Messages -->
        <template v-else>
          <MessageBubble
            v-for="msg in chatStore.messages"
            :key="msg.id || msg.tempId"
            :message="msg"
            :department-head-name="chatStore.departmentHeadName"
            viewer="REPORTER"
            @retry="handleRetryMessage"
          />
        </template>
      </div>

      <!-- Message Composer Area -->
      <MessageComposer
        :is-sending="chatStore.isSending"
        :is-socket-connected="chatStore.isSocketConnected"
        @send="handleSendMessage"
        @reconnect="handleReconnect"
      />
    </div>
  </div>
</template>

