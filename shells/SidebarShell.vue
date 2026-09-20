
<script setup lang="ts">
import { useAuthStore } from '@/shared/stores/auth'
const auth = useAuthStore()
</script>
<template>
  <aside class="w-64 flex-col bg-sidebar text-sidebar-foreground p-4">
    <div class="font-semibold mb-6">Verita</div>
    <span v-if="auth.user" class="text-sm opacity-70">{{ auth.user.role }}</span>
  </aside>
</template>