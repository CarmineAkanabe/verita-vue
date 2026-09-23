import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/types'
import type { User } from '@/shared/types/user'
import type {
  AccountDashboardData,
  NotificationsResponse,
  UpdateProfilePayload,
} from './types'

export async function getAccountDashboard(): Promise<AccountDashboardData> {
  const response = await apiClient.get<AccountDashboardData>('/account/dashboard')
  return response.data
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  if (payload.profile_picture) {
    const formData = new FormData()
    if (payload.first_name) formData.append('first_name', payload.first_name)
    if (payload.last_name) formData.append('last_name', payload.last_name)
    if (payload.email) formData.append('email', payload.email)
    if (payload.password) {
      formData.append('password', payload.password)
      if (payload.password_confirmation) {
        formData.append('password_confirmation', payload.password_confirmation)
      }
    }
    formData.append('profile_picture', payload.profile_picture)
    formData.append('_method', 'PUT')

    try {
      // Laravel standard method spoofing for multipart/form-data
      const response = await apiClient.post<ApiResponse<User>>('/account/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-HTTP-Method-Override': 'PUT',
        },
      })
      return response.data.data
    } catch (err: any) {
      // Fallback to direct PUT with formData if method spoofing is disabled
      if (err?.response?.status === 405) {
        const fallback = await apiClient.put<ApiResponse<User>>('/account/profile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        return fallback.data.data
      }
      throw err
    }
  }

  // Pure JSON PUT if no file upload
  const body: Record<string, string> = {}
  if (payload.first_name !== undefined && payload.first_name !== '') body.first_name = payload.first_name
  if (payload.last_name !== undefined && payload.last_name !== '') body.last_name = payload.last_name
  if (payload.email !== undefined && payload.email !== '') body.email = payload.email
  if (payload.password) {
    body.password = payload.password
    if (payload.password_confirmation) {
      body.password_confirmation = payload.password_confirmation
    }
  }

  const response = await apiClient.put<ApiResponse<User>>('/account/profile', body)
  return response.data.data
}

export async function getNotifications(page = 1): Promise<NotificationsResponse> {
  const response = await apiClient.get<NotificationsResponse>('/notifications', {
    params: { page },
  })
  return response.data
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/notifications/${notificationId}`)
}
