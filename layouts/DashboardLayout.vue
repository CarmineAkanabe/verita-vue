
<script setup lang="ts">
import SidebarShell from '@/shells/SidebarShell.vue'
import MobileNavigationShell from '@/shells/MobileNavigationShell.vue'
</script>
<template>
  <div class="min-h-screen flex">
    <SidebarShell class="hidden lg:flex" />
    <div class="flex-1 flex flex-col">
      <main class="flex-1 p-6 lg:p-8"><router-view /></main>
      <MobileNavigationShell class="lg:hidden" />
    </div>
  </div>
</template>