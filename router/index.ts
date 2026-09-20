import { createRouter, createWebHistory } from 'vue-router';
import { guestOnlyStaff, requireCaseAuth } from './guards';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: () => import('@/layouts/PublicLayout.vue'),
            children: [
                {
                    path: '',
                    name: 'home',
                    component: () => import('@/pages/public/Home.vue'),
                    meta: { title: 'Verita — Secure Case Intake' },
                },
                {
                    path: 'about',
                    name: 'about',
                    component: () => import('@/pages/public/About.vue'),
                    meta: { title: 'About Verita — Confidential Consultation' },
                },
                {
                    path: 'cases/submit',
                    name: 'submit-case',
                    component: () => import('@/pages/cases/CaseSubmission.vue'),
                    meta: { title: 'Submit Incident Report — Verita' },
                },
                {
                    path: 'cases/me',
                    name: 'case-dashboard',
                    beforeEnter: requireCaseAuth,
                    component: () => import('@/pages/cases/CaseDashboard.vue'),
                    meta: { title: 'Incident Dossier Dashboard — Verita' },
                },
                {
                    path: 'cases/me/chat',
                    name: 'case-chat',
                    beforeEnter: requireCaseAuth,
                    component: () => import('@/pages/cases/CaseChat.vue'),
                    meta: { title: 'Consultation Channel — Verita' },
                },
            ],
        },
        {
            path: '/auth',
            component: () => import('@/layouts/AuthLayout.vue'),
            beforeEnter: guestOnlyStaff,
            children: [
                {
                    path: '',
                    redirect: { name: 'staff-login' },
                },
                {
                    path: 'login',
                    name: 'staff-login',
                    component: () => import('@/pages/auth/StaffLogin.vue'),
                    meta: { title: 'Staff Sign In — Verita' },
                },
            ],
        },
        {
            path: '/cases',
            component: () => import('@/layouts/AuthLayout.vue'),
            children: [
                {
                    path: '',
                    redirect: { name: 'case-entry' },
                },
                {
                    path: 'verify-pin',
                    name: 'case-entry',
                    component: () => import('@/pages/auth/CaseEntry.vue'),
                    meta: { title: 'Track Case with PIN — Verita' },
                },
            ],
        },
        { path: '/app', component: () => import('@/layouts/DashboardLayout.vue'), children: [] },
        {
            path: '/:pathMatch(.*)*',
            component: () => import('@/layouts/ErrorLayout.vue'),
            children: [{ path: '', name: 'not-found', component: () => import('@/pages/error/NotFound.vue'), props: { code: 404 } }],
        },
    ],
})

router.afterEach((to) => {
    if (to.meta.title) {
        document.title = String(to.meta.title)
    }
})

export default router