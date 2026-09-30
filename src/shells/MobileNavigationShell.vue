<!-- shells/MobileNavigationShell.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import {
  LayoutDashboardIcon,
  BellIcon,
  UserCogIcon,
  BriefcaseIcon,
  Building2Icon,
  UsersIcon,
  MenuIcon,
} from '@lucide/vue'

defineEmits<{
  (e: 'open-menu'): void
}>()

const route = useRoute()
const auth = useAuthStore()

const isManager = computed(() => auth.user?.role === 'MANAGER')

function isActive(path: string) {
  if (path === '/app/dashboard') {
    return route.path === '/app' || route.path === '/app/dashboard'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="sticky bottom-0 z-40 border-t border-border bg-card p-1 flex justify-around items-center text-xs shadow-xs">
    <!-- Common: Dashboard -->
    <router-link
      to="/app/dashboard"
      class="flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors"
      :class="isActive('/app/dashboard') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
    >
      <LayoutDashboardIcon class="size-4" />
      <span class="text-[10px]">Dashboard</span>
    </router-link>

    <!-- Common: Cases -->
    <router-link
      to="/app/cases"
      class="flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors"
      :class="isActive('/app/cases') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
    >
      <BriefcaseIcon class="size-4" />
      <span class="text-[10px]">Cases</span>
    </router-link>

    <!-- MANAGER TABS: Departments & Dept Heads -->
    <template v-if="isManager">
      <router-link
        to="/app/departments"
        class="flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors"
        :class="isActive('/app/departments') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <Building2Icon class="size-4" />
        <span class="text-[10px]">Departments</span>
      </router-link>

      <router-link
        to="/app/department-heads"
        class="flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors"
        :class="isActive('/app/department-heads') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <UsersIcon class="size-4" />
        <span class="text-[10px]">Dept Heads</span>
      </router-link>
    </template>

    <!-- DEPARTMENT HEAD TABS: Alerts & Profile -->
    <template v-else>
      <router-link
        to="/app/notifications"
        class="flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors"
        :class="isActive('/app/notifications') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <BellIcon class="size-4" />
        <span class="text-[10px]">Alerts</span>
      </router-link>

      <router-link
        to="/app/profile"
        class="flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors"
        :class="isActive('/app/profile') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <UserCogIcon class="size-4" />
        <span class="text-[10px]">Profile</span>
      </router-link>
    </template>

    <!-- Drawer Trigger: Menu -->
    <button
      type="button"
      class="flex flex-col items-center gap-0.5 py-1 px-2 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      aria-label="Open full menu"
      @click="$emit('open-menu')"
    >
      <MenuIcon class="size-4" />
      <span class="text-[10px]">Menu</span>
    </button>
  </nav>
</template>