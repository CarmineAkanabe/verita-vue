<!-- layouts/DashboardLayout.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SidebarShell from '@/shells/SidebarShell.vue'
import MobileNavigationShell from '@/shells/MobileNavigationShell.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { logoutStaffApi } from '@/features/auth/api'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import { LogOutIcon, ShieldCheckIcon } from '@lucide/vue'

const router = useRouter()
const auth = useAuthStore()
const isLoggingOut = ref(false)

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
  <div class="min-h-screen flex flex-col lg:flex-row bg-background text-foreground">
    <!-- Desktop Sidebar -->
    <SidebarShell class="hidden lg:flex" />

    <!-- Mobile Header (lg:hidden) -->
    <header class="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar text-sidebar-foreground">
      <router-link to="/" class="flex items-center gap-2">
        <div class="h-7 w-7 rounded bg-white flex items-center justify-center overflow-hidden">
          <img src="/verita.png" alt="Verita" class="h-full w-full object-contain p-0.5" />
        </div>
        <span class="text-sm font-bold text-white">Verita Staff</span>
      </router-link>

      <div class="flex items-center gap-2">
        <span v-if="auth.user" class="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30">
          {{ auth.user.role === 'MANAGER' ? 'Manager' : 'Dept Head' }}
        </span>
        <button
          type="button"
          class="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-destructive/15 hover:bg-destructive/25 text-destructive-foreground border border-destructive/30 transition-colors cursor-pointer"
          :disabled="isLoggingOut"
          @click="handleLogout"
        >
          <LogOutIcon class="size-3" />
          <span>{{ isLoggingOut ? '...' : 'Sign out' }}</span>
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <main class="flex-1 p-6 lg:p-8">
        <router-view v-if="$route.matched.length > 2" />
        <!-- Temporary active session card until Phase 7 role-specific dashboard views -->
        <div v-else class="max-w-2xl mx-auto space-y-6 animate-fade-in-up pt-4">
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ShieldCheckIcon class="size-5" />
              </div>
              <div>
                <h1 class="text-lg font-bold text-foreground">
                  Enterprise Staff Portal
                </h1>
                <p class="text-xs text-muted-foreground">
                  Authenticated session established as <strong class="text-foreground">{{ auth.user?.role }}</strong>
                </p>
              </div>
            </div>

            <div class="p-3.5 rounded-lg bg-muted/50 border border-border/80 text-xs space-y-1 font-mono">
              <p><strong class="text-foreground">Staff Member:</strong> {{ [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ') || 'Authorized Staff' }}</p>
              <p><strong class="text-foreground">Email:</strong> {{ auth.user?.email }}</p>
              <p><strong class="text-foreground">Role Clearance:</strong> {{ auth.user?.role === 'MANAGER' ? 'Executive Management & Case Governance' : 'Department Case Review & Direct Intake' }}</p>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed">
              Full role-specific dashboards (case workload metrics, conflict-of-interest assignment, and engagement reporting) will be loaded in Phase 7 &amp; Phase 8.
            </p>

            <div class="pt-2 flex items-center gap-3">
              <AppButton to="/" variant="outline" size="sm">
                Platform overview &rarr;
              </AppButton>
              <AppButton
                variant="destructive"
                size="sm"
                :loading="isLoggingOut"
                @click="handleLogout"
              >
                <LogOutIcon class="size-3.5 mr-1.5" />
                Sign out of session
              </AppButton>
            </div>
          </div>
        </div>
      </main>
      <MobileNavigationShell class="lg:hidden" />
    </div>
  </div>
</template>