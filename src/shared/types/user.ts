export type UserRole = 'MANAGER' | 'DEPARTMENT_HEAD'
export type PresenceStatus = 'ONLINE' | 'OFFLINE'

export interface User {
    id: string
    firstName: string
    lastName: string
    email: string
    role: UserRole
    departmentId: string | null   // set for DEPARTMENT_HEAD, null for MANAGER
    staffId: string | null        // set for MANAGER, null for DEPARTMENT_HEAD
    profilePicture: string | null
    presenceStatus: PresenceStatus
}