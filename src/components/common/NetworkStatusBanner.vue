<!-- components/common/NetworkStatusBanner.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import {
  WifiOffIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
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

function onRetry() {
  isRetrying.value = true
  retryConnection()
  setTimeout(() => {
    isRetrying.value = false
  }, 1000)
}
</script>

<template>
  <div class="fixed top-0 inset-x-0 z-50 pointer-events-none transition-all duration-300">
    <!-- 1. Offline Banner -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0"
    >
      <div
        v-if="!isOnline"
        role="alert"
        aria-live="assertive"
        class="pointer-events-auto bg-amber-700 text-white px-4 py-2 text-xs shadow-md border-b border-amber-800 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2 min-w-0">
          <WifiOffIcon class="size-4 shrink-0 text-amber-200 animate-pulse" />
          <span class="font-medium truncate">
            <strong>Offline Mode:</strong> Internet connection lost. Live messaging and submissions are paused until reconnected.
          </span>
        </div>
        <button
          type="button"
          class="shrink-0 px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-900 text-white text-[11px] font-semibold border border-amber-500/50 flex items-center gap-1.5 cursor-pointer transition-colors"
          @click="onRetry"
        >
          <RefreshCwIcon class="size-3" :class="{ 'animate-spin': isRetrying }" />
          Retry
        </button>
      </div>
    </transition>

    <!-- 2. Realtime WebSocket Reconnecting Banner -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0"
    >
      <div
        v-if="isOnline && (isWsReconnecting || isWsFailed)"
        role="status"
        aria-live="polite"
        class="pointer-events-auto bg-[#22293A] text-white px-4 py-2 text-xs shadow-md border-b border-amber-500/40 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2 min-w-0">
          <AlertTriangleIcon class="size-4 shrink-0 text-amber-400" />
          <span class="text-slate-200 truncate">
            <strong class="text-amber-400">Live Sync Reconnecting:</strong> Real-time channel dropped. Trying to re-establish secure connection...
          </span>
        </div>
        <button
          type="button"
          class="shrink-0 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold border border-amber-500/40 flex items-center gap-1.5 cursor-pointer transition-colors"
          @click="onRetry"
        >
          <RefreshCwIcon class="size-3" :class="{ 'animate-spin': isRetrying }" />
          Reconnect
        </button>
      </div>
    </transition>

    <!-- 3. Connection Restored Notice -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0"
    >
      <div
        v-if="isOnline && !isWsReconnecting && !isWsFailed && showReconnectedNotice"
        role="status"
        aria-live="polite"
        class="pointer-events-auto bg-emerald-700 text-white px-4 py-1.5 text-xs shadow-md border-b border-emerald-800 flex items-center justify-center gap-2"
      >
        <CheckCircle2Icon class="size-3.5 text-emerald-200" />
        <span class="font-medium">Connection restored. Live synchronization active.</span>
      </div>
    </transition>
  </div>
</template>
