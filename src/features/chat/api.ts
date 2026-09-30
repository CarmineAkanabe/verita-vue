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
 * Send an end-to-end confidential message to the case chat.
 * Payload is strictly text + emojis only (up to 2,000 characters).
 */
export async function sendReporterMessage(content: string): Promise<ChatMessage> {
  const response = await apiClient.post<SendMessageResponse>('/cases/me/messages', {
    content: content.trim(),
  })
  return response.data.data
}

// ---------------------------------------------------------------------------
// Phase 9: Staff Case Consultation Channel (Department Head & Manager)
// ---------------------------------------------------------------------------

/**
 * Fetch consultation messages for a specific case (staff view).
 * Authorized for assigned Department Head or Manager oversight.
 */
export async function getStaffCaseMessages(caseId: string): Promise<ChatMessage[]> {
  const response = await apiClient.get<{ messages: ChatMessage[] } | ChatMessage[]>(
    `/cases/${encodeURIComponent(caseId)}/messages`
  )
  if (Array.isArray(response.data)) {
    return response.data
  }
  return response.data?.messages || []
}

/**
 * Send an official investigation message to the case reporter.
 * Authorized for assigned Department Head only.
 */
export async function sendStaffCaseMessage(caseId: string, content: string): Promise<ChatMessage> {
  const response = await apiClient.post<SendMessageResponse | { data: ChatMessage } | ChatMessage>(
    `/cases/${encodeURIComponent(caseId)}/messages`,
    { content: content.trim() }
  )
  if ('data' in response.data && response.data.data) {
    return response.data.data
  }
  return response.data as ChatMessage
}

