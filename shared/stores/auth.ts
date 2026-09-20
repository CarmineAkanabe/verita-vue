import { defineStore } from 'pinia';
import { caseToken, staffToken } from '@/shared/api/auth';
import { type User } from '@/shared/types';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        caseId: null as string | null,
    }),
    getters: {
        isStaffAuthenticated: (s) => !!s.user && !!staffToken.get(),
        isCaseAuthenticated: (s) => !!s.caseId && !!caseToken.get(),
    },
    actions: {
        setStaffSession(token: string, user: User) { staffToken.set(token); this.user = user },
        setCaseSession(token: string, caseId: string) { caseToken.set(token); this.caseId = caseId },
        logoutStaff() { staffToken.clear(); this.user = null },
        logoutCase() { caseToken.clear(); this.caseId = null },
    },
})