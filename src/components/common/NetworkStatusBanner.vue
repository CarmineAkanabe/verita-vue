<!-- components/common/NetworkStatusBanner.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  WifiOffIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XIcon,
} from '@lucide/vue'
import { useNetworkStatus } from '@/shared/realtime/useNetworkStatus'

const {
  isOnline,
  isWsReconnecting,
  isWsFailed,
  showReconnectedNotice,
  retryConnection,
} = useNetworkStatus()

const isRetrying = ref(false)
const isDismissed = ref(false)

// Reset dismiss state whenever alert conditions toggle
watch([isWsReconnecting, isWsFailed, isOnline], ([rec, failed, online]) => {
  if (!online || rec || failed) {
    isDismissed.value = false
  }
})

function onRetry() {
  isRetrying.value = true
  retryConnection()
  setTimeout(() => {
    isRetrying.value = false
  }, 1200)
}

function dismiss() {
  isDismissed.value = true
}
</script>

<template>
  <aside
    aria-label="Network and connection status"
    class="fixed bottom-5 right-5 z-50 pointer-events-none flex flex-col items-end gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)]"
  >
    <!-- 1. Offline Toast -->
    <transition
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="translate-x-8 opacity-0 scale-95"
      enter-to-class="translate-x-0 opacity-100 scale-100"
      leave-active-class="transform transition ease-in duration-200"
      leave-from-class="translate-x-0 opacity-100 scale-100"
      leave-to-class="translate-x-8 opacity-0 scale-95"
    >
      <div
        v-if="!isOnline && !isDismissed"
        role="alert"
        aria-live="assertive"
        class="pointer-events-auto w-full bg-[#78350F]/95 text-white p-3.5 rounded-2xl shadow-xl shadow-amber-950/20 border border-amber-500/40 backdrop-blur-md flex items-start gap-3 transition-all"
      >
        <div class="p-2 rounded-xl bg-amber-900/60 border border-amber-600/40 text-amber-200 shrink-0">
          <WifiOffIcon class="size-4 animate-pulse" />
        </div>

        <div class="flex-1 min-w-0 pr-1">
          <h4 class="text-xs font-bold text-white tracking-wide">
            Internet Disconnected
          </h4>
          <p class="text-[11px] text-amber-100/90 leading-relaxed mt-0.5">
            Offline mode active. Live messaging and updates will pause until your internet connection returns.
          </p>
          <div class="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              @click="onRetry"
            >
              <RefreshCwIcon class="size-3" :class="{ 'animate-spin': isRetrying }" />
              Retry Now
            </button>
            <button
              type="button"
              class="px-2 py-1 rounded-lg hover:bg-white/10 text-amber-200 text-[11px] font-medium transition-colors cursor-pointer"
              @click="dismiss"
            >
              Dismiss
            </button>
          </div>
        </div>

        <button
          type="button"
          class="shrink-0 p-1 text-amber-200/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss offline notice"
          @click="dismiss"
        >
          <XIcon class="size-3.5" />
        </button>
      </div>
    </transition>

    <!-- 2. Realtime WebSocket Reconnecting Toast (Closable & on the side) -->
    <transition
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="translate-x-8 opacity-0 scale-95"
      enter-to-class="translate-x-0 opacity-100 scale-100"
      leave-active-class="transform transition ease-in duration-200"
      leave-from-class="translate-x-0 opacity-100 scale-100"
      leave-to-class="translate-x-8 opacity-0 scale-95"
    >
      <div
        v-if="isOnline && (isWsReconnecting || isWsFailed) && !isDismissed"
        role="status"
        aria-live="polite"
        class="pointer-events-auto w-full bg-foreground/95 text-white p-3.5 rounded-2xl shadow-2xl shadow-[#22293A]/25 border border-border/25 backdrop-blur-md flex items-start gap-3 transition-all"
      >
        <div class="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
          <AlertTriangleIcon class="size-4 animate-bounce" />
        </div>

        <div class="flex-1 min-w-0 pr-1">
          <div class="flex items-center gap-2">
            <h4 class="text-xs font-bold text-white tracking-wide">
              Live Sync Reconnecting
            </h4>
            <span class="inline-block size-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed mt-0.5">
            Real-time channel dropped. Re-establishing secure WebSocket connection...
          </p>
          <div class="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg bg-primary hover:bg-[#8D4A17] active:scale-95 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              @click="onRetry"
            >
              <RefreshCwIcon class="size-3" :class="{ 'animate-spin': isRetrying }" />
              Reconnect
            </button>
            <button
              type="button"
              class="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
              @click="dismiss"
            >
              Dismiss
            </button>
          </div>
        </div>

        <button
          type="button"
          class="shrink-0 p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss reconnect notice"
          @click="dismiss"
        >
          <XIcon class="size-3.5" />
        </button>
      </div>
    </transition>

    <!-- 3. Connection Restored Toast -->
    <transition
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="translate-x-8 opacity-0 scale-95"
      enter-to-class="translate-x-0 opacity-100 scale-100"
      leave-active-class="transform transition ease-in duration-200"
      leave-from-class="translate-x-0 opacity-100 scale-100"
      leave-to-class="translate-x-8 opacity-0 scale-95"
    >
      <div
        v-if="isOnline && !isWsReconnecting && !isWsFailed && showReconnectedNotice"
        role="status"
        aria-live="polite"
        class="pointer-events-auto bg-[#064E3B]/95 text-white px-3.5 py-2.5 rounded-2xl shadow-xl shadow-emerald-950/20 border border-emerald-500/40 backdrop-blur-md flex items-center gap-2.5 transition-all"
      >
        <div class="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
          <CheckCircle2Icon class="size-3.5" />
        </div>
        <span class="text-xs font-medium text-emerald-100">
          Connection restored. Live synchronization active.
        </span>
      </div>
    </transition>
  </aside>
</template>
