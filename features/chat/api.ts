// features/chat/api.ts
import { apiClient } from '@/shared/api/client'
import type { ReporterChatResponse, SendMessageResponse, ChatMessage } from './types'

/**
 * Fetch consultation messages and assigned Department Head presence.
 * Note: Endpoint /cases/me/messages uses case token via interceptor and is not data-wrapped at the root.
 */
export async function getReporterMessages(): Promise<ReporterChatResponse> {
  const response = await apiClient.get<ReporterChatResponse>('/cases/me/messages')
  return response.data
}

/**
 * Send an end-to-end confidential message to the investigation docket.
 * Payload is strictly text + emojis only (up to 2,000 characters).
 */
export async function sendReporterMessage(content: string): Promise<ChatMessage> {
  const response = await apiClient.post<SendMessageResponse>('/cases/me/messages', {
    content: content.trim(),
  })
  return response.data.data
}
