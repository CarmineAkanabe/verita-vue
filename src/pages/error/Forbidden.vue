<!-- pages/error/Forbidden.vue -->
<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'
import {
  HomeIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
} from '@lucide/vue'
import { useAuthStore } from '@/shared/stores/auth'

defineProps<{
  code?: number
  message?: string
}>()

const auth = useAuthStore()
</script>

<template>
  <div class="max-w-md w-full mx-auto text-center space-y-6 animate-fade-in-up">
    <!-- Floating Emblem with Crimson / Shield Alert Accent -->
    <div class="relative inline-block animate-float">
      <!-- Ambient Outer Pulse Glow -->
      <div class="absolute -inset-2 rounded-2xl bg-rose-500/20 blur-md animate-pulse-glow"></div>

      <!-- Logo Container -->
      <div class="relative h-24 w-24 sm:h-28 sm:w-28 mx-auto rounded-2xl bg-card p-2.5 shadow-xl border-2 border-rose-500/40 overflow-hidden group">
        <img
          src="/verita.png"
          alt="Verita Owl Emblem"
          class="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none"></div>
      </div>

      <!-- Floating Badge -->
      <div class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-[#FFFDF9]/95 backdrop-blur-md px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 border border-rose-200 shadow-xs">
          <span class="relative flex h-1.5 w-1.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
          </span>
          ERR_{{ code ?? 403 }} · RESTRICTED ACCESS
        </span>
      </div>
    </div>

    <!-- Error Title & Description -->
    <div class="space-y-2 pt-2">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
        Access Restricted
      </h1>
      <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
        {{ message ?? 'Your account role does not have authorization to view this secure partition or administrative tool.' }}
      </p>
    </div>

    <div class="rounded-xl border border-border bg-card p-3.5 shadow-xs text-left card-hover-lift">
      <div class="flex items-start gap-2.5">
        <ShieldCheckIcon class="size-4 text-primary shrink-0 mt-0.5" />
        <div class="space-y-0.5">
          <p class="text-xs font-bold text-foreground">Strict Need-to-Know Isolation</p>
          <p class="text-[11px] text-muted-foreground leading-normal">
            Under ISO 37002 compliance, investigation files, personnel records, and directorate controls are restricted strictly by authorized access level.
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
      <AppButton
        v-if="auth.isStaffAuthenticated"
        to="/app/cases"
        variant="default"
        size="default"
        class="w-full sm:w-auto shadow-xs hover:shadow-md transition-all duration-300"
      >
        <LayoutDashboardIcon class="size-4 mr-1.5" />
        Return to My Queue
      </AppButton>
      <AppButton
        v-else-if="auth.isCaseAuthenticated"
        to="/cases/me"
        variant="default"
        size="default"
        class="w-full sm:w-auto shadow-xs hover:shadow-md transition-all duration-300"
      >
        <LayoutDashboardIcon class="size-4 mr-1.5" />
        Return to Case Dashboard
      </AppButton>
      <AppButton
        v-else
        to="/"
        variant="default"
        size="default"
        class="w-full sm:w-auto shadow-xs hover:shadow-md transition-all duration-300"
      >
        <HomeIcon class="size-4 mr-1.5" />
        Return to Home
      </AppButton>

      <button
        type="button"
        class="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium border border-border bg-white text-foreground hover:bg-muted/40 transition-colors w-full sm:w-auto cursor-pointer"
        @click="$router.back()"
      >
        <ArrowLeftIcon class="size-4 mr-1.5" />
        Go Back
      </button>
    </div>
  </div>
</template>
