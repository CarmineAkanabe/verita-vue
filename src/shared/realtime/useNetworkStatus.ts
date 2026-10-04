// shared/realtime/useNetworkStatus.ts
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { globalSocketStatus, getEcho, disconnectEcho } from './socket-client'

export type ConnectionState = 'connected' | 'connecting' | 'unavailable' | 'failed' | 'disconnected'

const isOnline = ref<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
const wasOffline = ref<boolean>(false)
const showReconnectedNotice = ref<boolean>(false)

let noticeTimeout: ReturnType<typeof setTimeout> | null = null

export function useNetworkStatus() {
  function handleOnline() {
    isOnline.value = true
    if (wasOffline.value) {
      showRecoveryBanner()
    }
    wasOffline.value = false
    retryConnection()
  }

  function handleOffline() {
    isOnline.value = false
    wasOffline.value = true
    showReconnectedNotice.value = false
  }

  function showRecoveryBanner() {
    showReconnectedNotice.value = true
    if (noticeTimeout) clearTimeout(noticeTimeout)
    noticeTimeout = setTimeout(() => {
      showReconnectedNotice.value = false
    }, 4000)
  }

  function retryConnection() {
    try {
      disconnectEcho()
      getEcho()
    } catch {
      // ignore
    }
  }

  watch(globalSocketStatus, (newStatus, oldStatus) => {
    if (newStatus === 'connected' && (oldStatus === 'unavailable' || oldStatus === 'failed' || wasOffline.value)) {
      showRecoveryBanner()
    }
  })

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  const wsState = computed<ConnectionState>(() => globalSocketStatus.value as ConnectionState)

  const isWsReconnecting = computed(() => {
    return isOnline.value && (globalSocketStatus.value === 'connecting' || globalSocketStatus.value === 'unavailable')
  })

  const isWsFailed = computed(() => {
    return isOnline.value && (globalSocketStatus.value === 'failed' || globalSocketStatus.value === 'disconnected')
  })

  return {
    isOnline,
    wsState,
    isWsReconnecting,
    isWsFailed,
    showReconnectedNotice,
    retryConnection,
  }
}
