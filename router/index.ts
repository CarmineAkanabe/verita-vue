import { createRouter, createWebHistory } from 'vue-router'
import { guestOnlyStaff, requireCaseAuth, requireStaffAuth, requireRole } from './guards'

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
          meta: { title: 'Case Dashboard — Verita' },
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
    {
      path: '/app',
      component: () => import('@/layouts/DashboardLayout.vue'),
      beforeEnter: requireStaffAuth,
      children: [
        {
          path: '',
          redirect: { name: 'account-dashboard' },
        },
        {
          path: 'dashboard',
          name: 'account-dashboard',
          component: () => import('@/pages/staff/AccountDashboard.vue'),
          meta: { title: 'Staff Dashboard — Verita' },
        },
        {
          path: 'profile',
          name: 'account-profile',
          component: () => import('@/pages/staff/ProfileSettings.vue'),
          meta: { title: 'Profile Settings — Verita' },
        },
        {
          path: 'notifications',
          name: 'account-notifications',
          component: () => import('@/pages/staff/NotificationsList.vue'),
          meta: { title: 'Notifications — Verita' },
        },
        {
          path: 'cases',
          name: 'staff-cases-index',
          component: () => import('@/pages/staff/cases/CasesIndex.vue'),
          meta: { title: 'Investigation Queue — Verita' },
        },
        {
          path: 'cases/:id',
          name: 'staff-case-detail',
          component: () => import('@/pages/staff/cases/CaseDetail.vue'),
          meta: { title: 'Case Details — Verita' },
        },
        {
          path: 'cases/:id/chat',
          name: 'staff-case-chat',
          component: () => import('@/pages/staff/cases/StaffCaseChat.vue'),
          meta: { title: 'Case Consultation — Verita' },
        },
        {
          path: 'departments',
          name: 'manager-departments',
          beforeEnter: requireRole(['MANAGER']),
          component: () => import('@/pages/staff/manager/ManageDepartments.vue'),
          meta: { title: 'Manage Departments — Verita' },
        },
        {
          path: 'department-heads',
          name: 'manager-department-heads',
          beforeEnter: requireRole(['MANAGER']),
          component: () => import('@/pages/staff/manager/ManageAccounts.vue'),
          meta: { title: 'Personnel Accounts — Verita' },
        },
        {
          path: 'reports/user-engagement',
          name: 'manager-engagement-reports',
          beforeEnter: requireRole(['MANAGER']),
          component: () => import('@/pages/staff/manager/EngagementReports.vue'),
          meta: { title: 'Engagement Reports — Verita' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/layouts/ErrorLayout.vue'),
      children: [
        {
          path: '',
          name: 'not-found',
          component: () => import('@/pages/error/NotFound.vue'),
          props: { code: 404 },
        },
      ],
    },
  ],
})

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = String(to.meta.title)
  }
})

export default router