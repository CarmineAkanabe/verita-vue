import { createRouter, createWebHistory } from 'vue-router';
import { guestOnlyStaff } from './guards';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: () => import('@/layouts/PublicLayout.vue'), children: [] },
        { path: '/auth', component: () => import('@/layouts/AuthLayout.vue'), beforeEnter: guestOnlyStaff, children: [] },
        { path: '/app', component: () => import('@/layouts/DashboardLayout.vue'), children: [] },
        {
            path: '/:pathMatch(.*)*',
            component: () => import('@/layouts/ErrorLayout.vue'),
            children: [{ path: '', name: 'not-found', component: () => import('@/pages/error/NotFound.vue'), props: { code: 404 } }],
        },
    ],
})

export default router