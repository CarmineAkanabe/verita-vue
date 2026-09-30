// features/manager/api.ts
import { apiClient } from '@/shared/api/client'
import type {
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  DepartmentHeadUser,
  CreateDepartmentHeadPayload,
  UpdateDepartmentHeadPayload,
  EngagementReportData,
} from './types'
import type { StaffCase } from '@/features/cases/types'

/**
 * Fetch all departments.
 */
export async function getDepartments(): Promise<Department[]> {
  const response = await apiClient.get<any>('/departments')
  const raw = response.data?.data || response.data || []
  return Array.isArray(raw) ? raw : []
}

/**
 * Create a new department.
 */
export async function createDepartment(payload: CreateDepartmentPayload): Promise<Department> {
  const response = await apiClient.post<any>('/departments', payload)
  return response.data?.data || response.data
}

/**
 * Update an existing department.
 */
export async function updateDepartment(
  id: string,
  payload: UpdateDepartmentPayload
): Promise<Department> {
  const response = await apiClient.put<any>(`/departments/${id}`, payload)
  return response.data?.data || response.data
}

/**
 * Delete a department.
 */
export async function deleteDepartment(id: string): Promise<void> {
  await apiClient.delete(`/departments/${id}`)
}

/**
 * Fetch all Department Heads.
 */
export async function getDepartmentHeads(): Promise<DepartmentHeadUser[]> {
  const response = await apiClient.get<any>('/department-heads')
  const raw = response.data?.data || response.data || []
  return (Array.isArray(raw) ? raw : []).map((u: any) => ({
    id: u.id,
    firstName: u.firstName || u.first_name || '',
    lastName: u.lastName || u.last_name || '',
    email: u.email,
    role: u.role || 'DEPARTMENT_HEAD',
    departmentId: u.departmentId || u.department_id,
    department: u.department || null,
    presenceStatus: u.presenceStatus || u.presence_status || 'OFFLINE',
    profilePicture: u.profilePicture || u.profile_picture || null,
    createdAt: u.createdAt || u.created_at,
    updatedAt: u.updatedAt || u.updated_at,
  }))
}

/**
 * Create a new Department Head officer account.
 */
export async function createDepartmentHead(
  payload: CreateDepartmentHeadPayload
): Promise<DepartmentHeadUser> {
  const body = {
    firstName: payload.firstName,
    first_name: payload.firstName,
    lastName: payload.lastName,
    last_name: payload.lastName,
    email: payload.email,
    password: payload.password,
    departmentId: payload.departmentId,
    department_id: payload.departmentId,
  }
  const response = await apiClient.post<any>('/department-heads', body)
  const u = response.data?.data || response.data
  return {
    id: u.id,
    firstName: u.firstName || u.first_name || payload.firstName,
    lastName: u.lastName || u.last_name || payload.lastName,
    email: u.email || payload.email,
    role: u.role || 'DEPARTMENT_HEAD',
    departmentId: u.departmentId || u.department_id || payload.departmentId,
    department: u.department || null,
    presenceStatus: u.presenceStatus || u.presence_status || 'OFFLINE',
    profilePicture: u.profilePicture || u.profile_picture || null,
  }
}

/**
 * Update an existing Department Head officer account.
 */
export async function updateDepartmentHead(
  id: string,
  payload: UpdateDepartmentHeadPayload
): Promise<DepartmentHeadUser> {
  const body: Record<string, any> = {}
  if (payload.firstName) {
    body.firstName = payload.firstName
    body.first_name = payload.firstName
  }
  if (payload.lastName) {
    body.lastName = payload.lastName
    body.last_name = payload.lastName
  }
  if (payload.email) {
    body.email = payload.email
  }
  if (payload.password) {
    body.password = payload.password
  }
  if (payload.departmentId) {
    body.departmentId = payload.departmentId
    body.department_id = payload.departmentId
  }

  const response = await apiClient.put<any>(`/department-heads/${id}`, body)
  const u = response.data?.data || response.data
  return {
    id: u.id || id,
    firstName: u.firstName || u.first_name || payload.firstName || '',
    lastName: u.lastName || u.last_name || payload.lastName || '',
    email: u.email || payload.email || '',
    role: u.role || 'DEPARTMENT_HEAD',
    departmentId: u.departmentId || u.department_id || payload.departmentId,
    department: u.department || null,
    presenceStatus: u.presenceStatus || u.presence_status || 'OFFLINE',
    profilePicture: u.profilePicture || u.profile_picture || null,
  }
}

/**
 * Delete a Department Head officer account.
 */
export async function deleteDepartmentHead(id: string): Promise<void> {
  await apiClient.delete(`/department-heads/${id}`)
}

/**
 * Fetch unassigned cases awaiting triage/assignment.
 */
export async function getCaseAssignments(): Promise<StaffCase[]> {
  const response = await apiClient.get<any>('/case-assignments')
  const raw = response.data?.data || response.data || []
  return (Array.isArray(raw) ? raw : []).map((c: any) => ({
    id: c.id,
    category: c.category,
    status: c.status,
    description: c.description,
    purposeOfTransaction: c.purposeOfTransaction || c.purpose_of_transaction,
    amountInvolved: c.amountInvolved || c.amount_involved,
    personInvolved: c.personInvolved || c.person_involved,
    transactionDate: c.transactionDate || c.transaction_date,
    concernsDepartmentHead: c.concernsDepartmentHead ?? c.concerns_department_head,
    assignedTo: c.assignedTo || c.assigned_to || null,
    assignedDepartmentHead: c.assignedDepartmentHead || c.assigned_department_head || null,
    resolutionSummary: c.resolutionSummary || c.resolution_summary,
    createdAt: c.createdAt || c.created_at,
    resolvedAt: c.resolvedAt || c.resolved_at,
    escalatedAt: c.escalatedAt || c.escalated_at,
    evidence: c.evidence || [],
    aiSummary: c.aiSummary || c.ai_summary,
    aiTimeline: c.aiTimeline || c.ai_timeline,
    aiFindings: c.aiFindings || c.ai_findings,
    aiProcessingFailed: Boolean(c.aiProcessingFailed ?? c.ai_processing_failed),
  }))
}

/**
 * Assign a case to a specific Department Head.
 */
export async function assignCase(
  caseId: string,
  departmentHeadId: string
): Promise<void> {
  await apiClient.post(`/case-assignments/${caseId}`, {
    departmentHeadId,
    department_head_id: departmentHeadId,
  })
}

/**
 * Fetch user engagement analytics report.
 */
export async function getEngagementReport(): Promise<EngagementReportData> {
  const response = await apiClient.get<any>('/reports/user-engagement')
  const data = response.data?.data || response.data || {}
  return {
    caseVolumeByDepartment: data.caseVolumeByDepartment || data.case_volume_by_department || [],
    averageResolutionDays:
      data.averageResolutionDays !== undefined
        ? data.averageResolutionDays
        : data.average_resolution_days !== undefined
        ? data.average_resolution_days
        : null,
    categoryBreakdownOverTime:
      data.categoryBreakdownOverTime || data.category_breakdown_over_time || [],
  }
}
