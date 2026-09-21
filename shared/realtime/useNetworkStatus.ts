// shared/realtime/useNetworkStatus.ts
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getEcho } from './socket-client'

export type ConnectionState = 'connected' | 'connecting' | 'unavailable' | 'failed' | 'disconnected'

const isOnline = ref<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
const wsState = ref<ConnectionState>('connected')
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
    // Attempt reconnecting WebSocket
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

  function bindEchoEvents() {
    try {
      const echo = getEcho()
      const pusherConnection = (echo as any)?.connector?.pusher?.connection
      if (pusherConnection) {
        pusherConnection.bind('state_change', (states: { previous: string; current: ConnectionState }) => {
          wsState.value = states.current
          if (states.current === 'connected' && (states.previous === 'unavailable' || states.previous === 'failed' || wasOffline.value)) {
            showRecoveryBanner()
          }
        })
        pusherConnection.bind('connected', () => {
          wsState.value = 'connected'
        })
        pusherConnection.bind('connecting', () => {
          wsState.value = 'connecting'
        })
        pusherConnection.bind('unavailable', () => {
          wsState.value = 'unavailable'
        })
        pusherConnection.bind('failed', () => {
          wsState.value = 'failed'
        })
        pusherConnection.bind('disconnected', () => {
          wsState.value = 'disconnected'
        })
      }
    } catch {
      // Echo may not be initialized yet
    }
  }

  function retryConnection() {
    try {
      const echo = getEcho()
      const pusherConnection = (echo as any)?.connector?.pusher?.connection
      if (pusherConnection && typeof pusherConnection.connect === 'function') {
        pusherConnection.connect()
      }
    } catch {
      // ignore
    }
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    bindEchoEvents()
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  const isWsReconnecting = computed(() => {
    return isOnline.value && (wsState.value === 'connecting' || wsState.value === 'unavailable')
  })

  const isWsFailed = computed(() => {
    return isOnline.value && (wsState.value === 'failed' || wsState.value === 'disconnected')
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
