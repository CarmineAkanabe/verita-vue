// features/auth/api.ts
import { apiClient } from '@/shared/api/client'
import type { LoginCredentials, LoginResponse, VerifyPinResponse } from './types'

export async function loginStaff(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    email: credentials.email.trim(),
    password: credentials.password,
  })
  return response.data
}

export async function verifyCasePin(caseId: string, pin: string): Promise<string> {
  const cleanId = caseId.trim()
  const response = await apiClient.post<VerifyPinResponse>(
    `/cases/${encodeURIComponent(cleanId)}/verify-pin`,
    {
      pin: pin.trim(),
    }
  )
  return response.data.data.token
}

export async function logoutStaffApi(): Promise<void> {
  try {
    await apiClient.post('/auth/logout')
  } catch {
    // Graceful degradation if token already expired or network disconnected
  }
}
