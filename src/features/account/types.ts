import type { PaginatedResponse } from '@/shared/types'

export type NotificationStatus = 'UNREAD' | 'READ'

export type NotificationType =
  | 'case_ready_for_review'
  | 'case_assigned'
  | 'new_message'
  | 'case_resolved'
  | 'case_escalated'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  status: NotificationStatus
  channel: string
  sentAt: string
}

export interface ManagerDashboardData {
  role: 'MANAGER'
  departmentCount: number
  userCount: number
}

export interface DepartmentHeadDashboardData {
  role: 'DEPARTMENT_HEAD'
  department:
    | string
    | {
        id?: string
        name?: string
      }
  assignedCaseCount: number
}

export type AccountDashboardData = ManagerDashboardData | DepartmentHeadDashboardData

export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  password_confirmation?: string
  profile_picture?: File
}

export interface NotificationsResponse extends PaginatedResponse<NotificationItem> {}
