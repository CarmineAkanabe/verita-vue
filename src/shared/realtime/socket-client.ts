// shared/realtime/socket-client.ts
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { staffToken, caseToken } from '@/shared/api/auth'

declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo<any>
  }
}

window.Pusher = Pusher

let echoInstance: Echo<any> | null = null
let currentToken: string | null = null

export function getEcho(token?: string | null): Echo<any> {
  const effectiveToken = token || staffToken.get() || caseToken.get() || null

  if (echoInstance && currentToken === effectiveToken) {
    return echoInstance
  }

  if (echoInstance) {
    try {
      echoInstance.disconnect()
    } catch {
      // ignore
    }
    echoInstance = null
  }

  currentToken = effectiveToken

  const appKey = (import.meta.env.VITE_REVERB_APP_KEY as string) || 'eafnuy9gwxipsopxuepc'
  const host = (import.meta.env.VITE_REVERB_HOST as string) || 'localhost'
  const port = Number(import.meta.env.VITE_REVERB_PORT || 8080)
  const scheme = (import.meta.env.VITE_REVERB_SCHEME as string) || 'http'
  const isHttps = scheme === 'https'
  const apiOrigin = (import.meta.env.VITE_API_ORIGIN as string) || 'http://localhost:8000'

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: appKey,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: isHttps,
    enabledTransports: ['ws', 'wss'],
    client: Pusher,
    authEndpoint: `${apiOrigin}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: effectiveToken ? `Bearer ${effectiveToken}` : '',
        Accept: 'application/json',
      },
    },
  })

  window.Echo = echoInstance
  return echoInstance
}

export function disconnectEcho(): void {
  if (echoInstance) {
    try {
      echoInstance.disconnect()
    } catch {
      // ignore
    }
    echoInstance = null
    currentToken = null
  }
}
