import { createRouter, createWebHistory } from 'vue-router';
import { guestOnlyStaff } from './guards';

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
            ],
        },
        { path: '/auth', component: () => import('@/layouts/AuthLayout.vue'), beforeEnter: guestOnlyStaff, children: [] },
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