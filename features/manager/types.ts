// features/manager/types.ts

export interface Department {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateDepartmentPayload {
  name: string
}

export interface UpdateDepartmentPayload {
  name: string
}

export interface DepartmentHeadUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'DEPARTMENT_HEAD'
  departmentId?: string
  department?: Department | null
  presenceStatus?: 'ONLINE' | 'OFFLINE'
  profilePicture?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateDepartmentHeadPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  departmentId: string
}

export interface UpdateDepartmentHeadPayload {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  departmentId?: string
}

export interface AssignCasePayload {
  departmentHeadId: string
}

export interface DepartmentVolumeItem {
  department: string
  count: number
}

export interface CategoryBreakdownItem {
  month: string
  category: string
  count: number
}

export interface EngagementReportData {
  caseVolumeByDepartment: DepartmentVolumeItem[]
  averageResolutionDays: number | null
  categoryBreakdownOverTime: CategoryBreakdownItem[]
}
