<!-- shells/HeaderShell.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { logoutStaffApi } from '@/features/auth/api'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import {
  MenuIcon,
  XIcon,
  ShieldCheckIcon,
  LogOutIcon,
  UserCheckIcon,
} from '@lucide/vue'

const router = useRouter()
const auth = useAuthStore()
const mobileMenuOpen = ref(false)
const isLoggingOut = ref(false)

async function handleLogout() {
  isLoggingOut.value = true
  try {
    await logoutStaffApi()
  } finally {
    auth.logoutStaff()
    toast.success('Signed out of staff session.')
    isLoggingOut.value = false
    mobileMenuOpen.value = false
    await router.push('/auth/login')
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-border bg-[#EFE6D8] shadow-xs">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Brand Logo / Wordmark -->
      <div class="flex items-center gap-3">
        <router-link to="/" class="flex items-center gap-2.5 group">
          <div class="h-9 w-9 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-border shadow-xs group-hover:scale-105 group-hover:border-primary/60 transition-all duration-300">
            <img src="/verita.png" alt="Verita Logo" class="h-full w-full object-contain p-0.5" />
          </div>
          <div class="flex flex-col">
            <span class="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              Verita
            </span>
            <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Enterprise Trust Platform
            </span>
          </div>
        </router-link>
      </div>

      <!-- Desktop Navigation Links -->
      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold">
        <router-link
          to="/"
          class="text-foreground/85 hover:text-primary transition-colors"
          active-class="!text-primary font-bold"
        >
          Home
        </router-link>
        <router-link
          to="/about"
          class="text-foreground/85 hover:text-primary transition-colors"
          active-class="!text-primary font-bold"
        >
          About &amp; Governance
        </router-link>
        <a
          href="/#how-it-works"
          class="text-muted-foreground hover:text-foreground transition-colors"
        >
          How It Works
        </a>
      </nav>

      <!-- Desktop Header Actions -->
      <div class="hidden md:flex items-center gap-3">
        <template v-if="auth.isStaffAuthenticated">
          <div class="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#E2D5C0] border border-border text-xs">
            <UserCheckIcon class="size-3.5 text-primary" />
            <span class="font-semibold text-foreground">
              {{ auth.user?.firstName || 'Staff' }}
            </span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/15 text-primary">
              {{ auth.user?.role === 'MANAGER' ? 'Manager' : 'Dept Head' }}
            </span>
          </div>

          <AppButton
            to="/app"
            variant="secondary"
            size="sm"
            class="bg-white/90 hover:bg-white border border-border text-foreground shadow-2xs font-semibold cursor-pointer"
          >
            Staff Portal
          </AppButton>

          <AppButton
            variant="ghost"
            size="sm"
            class="text-muted-foreground hover:text-destructive cursor-pointer"
            :loading="isLoggingOut"
            @click="handleLogout"
          >
            <LogOutIcon class="size-3.5 mr-1" />
            Sign out
          </AppButton>
        </template>
        <template v-else>
          <router-link
            to="/auth/login"
            class="text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
          >
            Staff sign in
          </router-link>
          <AppButton
            to="/cases/verify-pin"
            variant="outline"
            size="sm"
            class="bg-white/90 hover:bg-white border-border text-foreground shadow-2xs font-semibold"
          >
            Track a case
          </AppButton>
          <AppButton
            to="/cases/submit"
            variant="default"
            size="sm"
            class="shadow-xs font-semibold"
          >
            <ShieldCheckIcon class="size-4 mr-1.5" />
            Report an incident
          </AppButton>
        </template>
      </div>

      <!-- Mobile Menu Toggle -->
      <div class="flex md:hidden">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-[#E2D5C0] border border-transparent hover:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-colors cursor-pointer"
          @click="mobileMenuOpen = !mobileMenuOpen"
          aria-label="Toggle navigation menu"
        >
          <MenuIcon v-if="!mobileMenuOpen" class="size-5" />
          <XIcon v-else class="size-5" />
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer / Dropdown -->
    <div v-if="mobileMenuOpen" class="border-b border-border bg-[#EFE6D8] px-4 pt-2 pb-6 md:hidden shadow-md">
      <div class="flex flex-col space-y-3 pt-2">
        <router-link
          to="/"
          class="text-sm font-semibold text-foreground hover:text-primary py-2"
          @click="mobileMenuOpen = false"
        >
          Home
        </router-link>
        <router-link
          to="/about"
          class="text-sm font-semibold text-foreground hover:text-primary py-2"
          @click="mobileMenuOpen = false"
        >
          About &amp; Governance
        </router-link>
        <a
          href="/#how-it-works"
          class="text-sm font-semibold text-muted-foreground hover:text-foreground py-2"
          @click="mobileMenuOpen = false"
        >
          How It Works
        </a>

        <div class="pt-4 border-t border-border flex flex-col gap-2">
          <template v-if="auth.isStaffAuthenticated">
            <div class="flex items-center justify-between p-2.5 rounded-lg bg-[#E2D5C0] border border-border text-xs mb-1">
              <span class="font-semibold text-foreground">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary">
                {{ auth.user?.role }}
              </span>
            </div>
            <AppButton to="/app" variant="secondary" class="w-full justify-center bg-white/90 hover:bg-white border border-border text-foreground font-semibold" @click="mobileMenuOpen = false">
              Staff Portal
            </AppButton>
            <AppButton
              variant="outline"
              class="w-full justify-center text-destructive border-destructive/30 bg-white/80"
              :loading="isLoggingOut"
              @click="handleLogout"
            >
              <LogOutIcon class="size-3.5 mr-1.5" />
              Sign out
            </AppButton>
          </template>
          <template v-else>
            <AppButton to="/cases/submit" variant="default" class="w-full justify-center font-semibold" @click="mobileMenuOpen = false">
              <ShieldCheckIcon class="size-4 mr-1.5" />
              Report an incident
            </AppButton>
            <AppButton to="/cases/verify-pin" variant="outline" class="w-full justify-center bg-white/90 hover:bg-white border-border text-foreground font-semibold" @click="mobileMenuOpen = false">
              Track a case
            </AppButton>
            <router-link
              to="/auth/login"
              class="text-center text-xs font-semibold text-muted-foreground hover:text-foreground py-2"
              @click="mobileMenuOpen = false"
            >
              Staff sign in &rarr;
            </router-link>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>