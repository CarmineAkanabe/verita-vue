<!-- shells/MobileNavigationShell.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  LayoutDashboardIcon,
  BellIcon,
  UserCogIcon,
  BriefcaseIcon,
} from '@lucide/vue'

const route = useRoute()

function isActive(path: string) {
  if (path === '/app/dashboard') {
    return route.path === '/app' || route.path === '/app/dashboard'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="sticky bottom-0 z-40 border-t border-border bg-card p-1.5 flex justify-around items-center text-xs shadow-xs">
    <router-link
      to="/app/dashboard"
      class="flex flex-col items-center gap-1 py-1 px-3 rounded transition-colors"
      :class="isActive('/app/dashboard') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
    >
      <LayoutDashboardIcon class="size-4" />
      <span class="text-[10px]">Dashboard</span>
    </router-link>

    <router-link
      to="/app/cases"
      class="flex flex-col items-center gap-1 py-1 px-3 rounded transition-colors"
      :class="isActive('/app/cases') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
    >
      <BriefcaseIcon class="size-4" />
      <span class="text-[10px]">Cases</span>
    </router-link>

    <router-link
      to="/app/notifications"
      class="flex flex-col items-center gap-1 py-1 px-3 rounded transition-colors"
      :class="isActive('/app/notifications') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
    >
      <BellIcon class="size-4" />
      <span class="text-[10px]">Alerts</span>
    </router-link>

    <router-link
      to="/app/profile"
      class="flex flex-col items-center gap-1 py-1 px-3 rounded transition-colors"
      :class="isActive('/app/profile') ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
    >
      <UserCogIcon class="size-4" />
      <span class="text-[10px]">Profile</span>
    </router-link>
  </nav>
</template>