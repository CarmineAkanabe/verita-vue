import { type NavigationGuardWithThis } from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth';

export const requireStaffAuth: NavigationGuardWithThis<undefined> = (to) => {
    const auth = useAuthStore()
    if (!auth.isStaffAuthenticated) return { name: 'staff-login', query: { redirect: to.fullPath } }
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

// TODO(phase7): data-init guard — hydrate `user` from GET /account/dashboard
// on hard refresh when a staffToken exists but the store is empty.