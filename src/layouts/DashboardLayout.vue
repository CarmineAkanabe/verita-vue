<!-- layouts/DashboardLayout.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SidebarShell from '@/shells/SidebarShell.vue'
import MobileNavigationShell from '@/shells/MobileNavigationShell.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { logoutStaffApi } from '@/features/auth/api'
import { toast } from '@/plugins/toast'
import RouteTransition from '@/components/common/RouteTransition.vue'
import { LogOutIcon, MenuIcon, XIcon } from '@lucide/vue'

const router = useRouter()
const auth = useAuthStore()
const isLoggingOut = ref(false)
const isMobileDrawerOpen = ref(false)

router.afterEach(() => {
  isMobileDrawerOpen.value = false
})

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
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <!-- Desktop Sidebar (Fixed when scrolling) -->
    <SidebarShell class="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64" />

    <!-- Mobile Slide-out Drawer Overlay -->
    <div
      v-if="isMobileDrawerOpen"
      class="fixed inset-0 z-50 lg:hidden flex"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        @click="isMobileDrawerOpen = false"
      ></div>

      <!-- Slide-out Drawer Panel -->
      <div class="relative w-72 max-w-[85vw] bg-sidebar text-sidebar-foreground z-10 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
        <div class="flex items-center justify-between p-3.5 border-b border-sidebar-border bg-sidebar-accent/30 shrink-0">
          <span class="text-xs font-bold text-white uppercase tracking-wider">Staff Navigation</span>
          <button
            type="button"
            class="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close menu"
            @click="isMobileDrawerOpen = false"
          >
            <XIcon class="size-5" />
          </button>
        </div>
        <SidebarShell class="flex-1 overflow-y-auto w-full border-r-0 min-h-0" />
      </div>
    </div>

    <!-- Mobile Header (lg:hidden) -->
    <header class="lg:hidden flex items-center justify-between px-3.5 py-3 border-b border-border bg-sidebar text-sidebar-foreground">
      <div class="flex items-center gap-2.5">
        <button
          type="button"
          class="p-1.5 rounded-lg bg-sidebar-accent/60 hover:bg-sidebar-accent text-white border border-sidebar-border transition-colors cursor-pointer"
          aria-label="Open navigation menu"
          @click="isMobileDrawerOpen = true"
        >
          <MenuIcon class="size-5" />
        </button>

        <router-link to="/app/dashboard" class="flex items-center gap-2">
          <div class="h-7 w-7 rounded bg-white flex items-center justify-center overflow-hidden">
            <img src="/verita.png" alt="Verita" class="h-full w-full object-contain p-0.5" />
          </div>
          <span class="text-sm font-bold text-white">Verita Staff</span>
        </router-link>
      </div>

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
    <div class="flex-1 flex flex-col min-w-0 lg:pl-64">
      <main class="flex-1 p-4 sm:p-6 lg:p-8">
        <RouteTransition />
      </main>
      <MobileNavigationShell class="lg:hidden" @open-menu="isMobileDrawerOpen = true" />
    </div>
  </div>
</template>