<!-- shells/SidebarShell.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { logoutStaffApi } from '@/features/auth/api'
import { toast } from '@/plugins/toast'
import { getAvatarUrl } from '@/utils/avatar'
import {
  LogOutIcon,
  HomeIcon,
  ShieldCheckIcon,
  LockIcon,
  LayoutDashboardIcon,
  BellIcon,
  UserCogIcon,
  BriefcaseIcon,
  Building2Icon,
  UsersIcon,
  BarChart3Icon,
} from '@lucide/vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isLoggingOut = ref(false)
const imageLoadError = ref(false)

const isManager = computed(() => auth.user?.role === 'MANAGER')
const avatarUrl = computed(() => getAvatarUrl(auth.user?.profilePicture))

const userInitials = computed(() => {
  const f = auth.user?.firstName?.[0] || 'S'
  const l = auth.user?.lastName?.[0] || ''
  return (f + l).toUpperCase()
})

function isActive(path: string) {
  if (path === '/app/dashboard') {
    return route.path === '/app' || route.path === '/app/dashboard'
  }
  return route.path.startsWith(path)
}

async function handleLogout() {
  isLoggingOut.value = true
  try {
    await logoutStaffApi()
  } finally {
    auth.logoutStaff()
    toast.success('Signed out of staff session.')
    isLoggingOut.value = false
    await router.push('/auth/login')
  }
}
</script>

<template>
  <aside class="w-64 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen">
    <!-- Brand Header -->
    <div class="p-5 border-b border-sidebar-border">
      <router-link to="/" class="flex items-center gap-2.5 group">
        <div class="h-9 w-9 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-white/20 shadow-xs group-hover:scale-105 transition-all">
          <img src="/verita.png" alt="Verita Logo" class="h-full w-full object-contain p-0.5" />
        </div>
        <div class="flex flex-col">
          <span class="text-base font-bold tracking-tight text-white leading-tight">
            Verita
          </span>
          <span class="text-[9px] font-semibold text-sidebar-foreground/70 uppercase tracking-widest">
            Enterprise Console
          </span>
        </div>
      </router-link>
    </div>

    <!-- User Profile Strip -->
    <div v-if="auth.user" class="p-4 border-b border-sidebar-border bg-sidebar-accent/40">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-full overflow-hidden bg-sidebar-primary/20 border border-sidebar-primary/40 flex items-center justify-center text-sidebar-primary font-bold text-sm shrink-0">
          <img
            v-if="avatarUrl && !imageLoadError"
            :src="avatarUrl"
            alt="Profile Avatar"
            class="w-full h-full object-cover"
            @error="imageLoadError = true"
          />
          <span v-else>{{ userInitials }}</span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-white truncate">
            {{ [auth.user.firstName, auth.user.lastName].filter(Boolean).join(' ') || 'Authorized Staff' }}
          </p>
          <p class="text-[11px] text-sidebar-foreground/70 truncate font-mono">
            {{ auth.user.email }}
          </p>
        </div>
      </div>
      <div class="mt-2.5 flex items-center gap-1.5">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30 uppercase tracking-wider">
          <ShieldCheckIcon class="size-3" />
          {{ isManager ? 'Executive Manager' : 'Department Head' }}
        </span>
      </div>
    </div>

    <!-- Navigation Area -->
    <div class="flex-1 p-3 space-y-1.5 overflow-y-auto">
      <div class="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        Staff Operations
      </div>

      <!-- Dashboard -->
      <router-link
        to="/app/dashboard"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        :class="isActive('/app/dashboard') ? 'text-white bg-sidebar-accent border border-sidebar-border font-semibold' : 'text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50'"
      >
        <LayoutDashboardIcon class="size-4" :class="isActive('/app/dashboard') ? 'text-sidebar-primary' : ''" />
        <span>Staff Dashboard</span>
      </router-link>

      <!-- Case Management Queue -->
      <router-link
        to="/app/cases"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        :class="isActive('/app/cases') ? 'text-white bg-sidebar-accent border border-sidebar-border font-semibold' : 'text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50'"
      >
        <BriefcaseIcon class="size-4" :class="isActive('/app/cases') ? 'text-sidebar-primary' : ''" />
        <span>Cases &amp; Triage</span>
      </router-link>

      <!-- Notifications -->
      <router-link
        to="/app/notifications"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        :class="isActive('/app/notifications') ? 'text-white bg-sidebar-accent border border-sidebar-border font-semibold' : 'text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50'"
      >
        <BellIcon class="size-4" :class="isActive('/app/notifications') ? 'text-sidebar-primary' : ''" />
        <span>Notifications</span>
      </router-link>

      <!-- Profile Settings -->
      <router-link
        to="/app/profile"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        :class="isActive('/app/profile') ? 'text-white bg-sidebar-accent border border-sidebar-border font-semibold' : 'text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50'"
      >
        <UserCogIcon class="size-4" :class="isActive('/app/profile') ? 'text-sidebar-primary' : ''" />
        <span>Profile &amp; Security</span>
      </router-link>

      <!-- MANAGER-ONLY SECTION -->
      <template v-if="isManager">
        <div class="pt-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 border-t border-sidebar-border/60 mt-3">
          Governance Console
        </div>

        <router-link
          to="/app/departments"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          :class="isActive('/app/departments') ? 'text-white bg-sidebar-accent border border-sidebar-border font-semibold' : 'text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50'"
        >
          <Building2Icon class="size-4" :class="isActive('/app/departments') ? 'text-sidebar-primary' : ''" />
          <span>Departments</span>
        </router-link>

        <router-link
          to="/app/department-heads"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          :class="isActive('/app/department-heads') ? 'text-white bg-sidebar-accent border border-sidebar-border font-semibold' : 'text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50'"
        >
          <UsersIcon class="size-4" :class="isActive('/app/department-heads') ? 'text-sidebar-primary' : ''" />
          <span>Personnel Accounts</span>
        </router-link>

        <router-link
          to="/app/reports/user-engagement"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          :class="isActive('/app/reports') ? 'text-white bg-sidebar-accent border border-sidebar-border font-semibold' : 'text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50'"
        >
          <BarChart3Icon class="size-4" :class="isActive('/app/reports') ? 'text-sidebar-primary' : ''" />
          <span>Engagement Reports</span>
        </router-link>
      </template>

      <!-- Public Site Link -->
      <div class="pt-3 border-t border-sidebar-border/60 mt-3">
        <router-link
          to="/"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50 transition-colors"
        >
          <HomeIcon class="size-4" />
          <span>Public Portal</span>
        </router-link>
      </div>
    </div>

    <!-- Footer / Sign Out Section -->
    <div class="p-3 border-t border-sidebar-border bg-sidebar/80 space-y-2">
      <div class="flex items-center justify-between text-[10px] text-sidebar-foreground/50 px-2">
        <span class="flex items-center gap-1">
          <LockIcon class="size-3" />
          Audited Session
        </span>
        <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
      </div>

      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive-foreground/90 bg-destructive/15 hover:bg-destructive/25 border border-destructive/30 hover:border-destructive/50 transition-all cursor-pointer disabled:opacity-50"
        :disabled="isLoggingOut"
        @click="handleLogout"
      >
        <LogOutIcon class="size-4" />
        <span>{{ isLoggingOut ? 'Signing out...' : 'Sign out' }}</span>
      </button>
    </div>
  </aside>
</template>