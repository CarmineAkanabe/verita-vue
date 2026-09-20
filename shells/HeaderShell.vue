<!-- shells/HeaderShell.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/shared/stores/auth'
import AppButton from '@/components/common/AppButton.vue'
import { MenuIcon, XIcon, ShieldCheckIcon } from '@lucide/vue'

const auth = useAuthStore()
const mobileMenuOpen = ref(false)
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-none">
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
            <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Enterprise Trust Platform
            </span>
          </div>
        </router-link>
      </div>

      <!-- Desktop Navigation Links -->
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
        <router-link
          to="/"
          class="text-foreground hover:text-primary transition-colors"
          active-class="text-primary font-semibold"
        >
          Home
        </router-link>
        <router-link
          to="/about"
          class="text-foreground hover:text-primary transition-colors"
          active-class="text-primary font-semibold"
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
          <AppButton to="/app" variant="secondary" size="sm">
            Staff Portal
          </AppButton>
        </template>
        <template v-else>
          <router-link
            to="/auth/login"
            class="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
          >
            Staff sign in
          </router-link>
          <AppButton to="/cases/verify-pin" variant="outline" size="sm">
            Track a case
          </AppButton>
          <AppButton to="/cases/submit" variant="default" size="sm">
            <ShieldCheckIcon class="size-4 mr-1.5" />
            Report an incident
          </AppButton>
        </template>
      </div>

      <!-- Mobile Menu Toggle -->
      <div class="flex md:hidden">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          @click="mobileMenuOpen = !mobileMenuOpen"
          aria-label="Toggle navigation menu"
        >
          <MenuIcon v-if="!mobileMenuOpen" class="size-5" />
          <XIcon v-else class="size-5" />
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer / Dropdown -->
    <div v-if="mobileMenuOpen" class="border-b border-border bg-background px-4 pt-2 pb-6 md:hidden">
      <div class="flex flex-col space-y-3 pt-2">
        <router-link
          to="/"
          class="text-sm font-medium text-foreground hover:text-primary py-2"
          @click="mobileMenuOpen = false"
        >
          Home
        </router-link>
        <router-link
          to="/about"
          class="text-sm font-medium text-foreground hover:text-primary py-2"
          @click="mobileMenuOpen = false"
        >
          About &amp; Governance
        </router-link>
        <a
          href="/#how-it-works"
          class="text-sm font-medium text-muted-foreground hover:text-foreground py-2"
          @click="mobileMenuOpen = false"
        >
          How It Works
        </a>

        <div class="pt-4 border-t border-border flex flex-col gap-2">
          <template v-if="auth.isStaffAuthenticated">
            <AppButton to="/app" variant="secondary" class="w-full justify-center" @click="mobileMenuOpen = false">
              Staff Portal
            </AppButton>
          </template>
          <template v-else>
            <AppButton to="/cases/submit" variant="default" class="w-full justify-center" @click="mobileMenuOpen = false">
              <ShieldCheckIcon class="size-4 mr-1.5" />
              Report an incident
            </AppButton>
            <AppButton to="/cases/verify-pin" variant="outline" class="w-full justify-center" @click="mobileMenuOpen = false">
              Track a case
            </AppButton>
            <router-link
              to="/auth/login"
              class="text-center text-xs text-muted-foreground hover:text-foreground py-2"
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