import type { NavigationGuardWithThis } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { staffToken } from '@/shared/api/auth'

export const requireStaffAuth: NavigationGuardWithThis<undefined> = (to) => {
  const auth = useAuthStore()
  const token = staffToken.get()

  if (!token) {
    return { name: 'staff-login', query: { redirect: to.fullPath } }
  }

  // If token exists but user state is missing, clear invalid session
  if (!auth.user) {
    auth.logoutStaff()
    return { name: 'staff-login', query: { redirect: to.fullPath } }
  }
}

export const requireRole = (roles: Array<'MANAGER' | 'DEPARTMENT_HEAD'>): NavigationGuardWithThis<undefined> => () => {
  const auth = useAuthStore()
  if (!auth.user || !roles.includes(auth.user.role)) return { name: 'not-found' }
}

export const requireCaseAuth: NavigationGuardWithThis<undefined> = () => {
  const auth = useAuthStore()
  if (!auth.isCaseAuthenticated) return { name: 'case-entry' }
}

export const guestOnlyStaff: NavigationGuardWithThis<undefined> = () => {
  const auth = useAuthStore()
  if (auth.isStaffAuthenticated) return { path: '/app' }
}