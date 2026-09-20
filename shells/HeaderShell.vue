
<script setup lang="ts">
import { useAuthStore } from '@/shared/stores/auth'
const auth = useAuthStore()
</script>
<template>
  <header class="border-b bg-background px-4 py-3 flex items-center justify-between">
    <router-link to="/" class="font-semibold">Verita</router-link>
    <router-link v-if="!auth.isStaffAuthenticated" to="/auth/login" class="text-sm">Staff sign in</router-link>
  </header>
</template>