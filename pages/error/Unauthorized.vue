<!-- pages/error/Unauthorized.vue -->
<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'
import {
  LogInIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  HomeIcon,
  ShieldAlertIcon,
} from '@lucide/vue'

defineProps<{
  code?: number
  message?: string
}>()
</script>

<template>
  <div class="max-w-md w-full mx-auto text-center space-y-6 animate-fade-in-up">
    <!-- Floating Emblem with Warning / Amber Light Glow -->
    <div class="relative inline-block animate-float">
      <!-- Ambient Outer Pulse Glow -->
      <div class="absolute -inset-2 rounded-2xl bg-amber-500/20 blur-md animate-pulse-glow"></div>

      <!-- Logo Container -->
      <div class="relative h-24 w-24 sm:h-28 sm:w-28 mx-auto rounded-2xl bg-[#F8F3EA] p-2.5 shadow-xl border-2 border-amber-600/40 overflow-hidden group">
        <img
          src="/verita.png"
          alt="Verita Owl Emblem"
          class="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none"></div>
      </div>

      <!-- Floating Badge -->
      <div class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-[#FFFDF9]/95 backdrop-blur-md px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 border border-[#E2D5C3] shadow-xs">
          <span class="relative flex h-1.5 w-1.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-600 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600"></span>
          </span>
          ERR_{{ code ?? 401 }} · ACCESS EXPIRED
        </span>
      </div>
    </div>

    <!-- Error Title & Description -->
    <div class="space-y-2 pt-2">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
        Authentication Required
      </h1>
      <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
        {{ message ?? 'Your session credentials have expired or this partition requires active authentication to proceed.' }}
      </p>
    </div>

    <!-- Security Assurance Card -->
    <div class="rounded-xl border border-[#E2D5C3] bg-[#F8F3EA] p-3.5 shadow-xs text-left card-hover-lift">
      <div class="flex items-start gap-2.5">
        <ShieldCheckIcon class="size-4 text-emerald-600 shrink-0 mt-0.5" />
        <div class="space-y-0.5">
          <p class="text-xs font-bold text-foreground">Zero Identity Exposure</p>
          <p class="text-[11px] text-muted-foreground leading-normal">
            Verita sessions expire automatically to protect confidential records. No temporary tokens or device identifiers were retained.
          </p>
        </div>
      </div>
    </div>

    <!-- Dual-Action Recovery Paths -->
    <div class="space-y-2.5 pt-1">
      <p class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Select Authentication Path
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <AppButton
          to="/auth/login"
          variant="default"
          size="default"
          class="w-full shadow-xs hover:shadow-md transition-all duration-300"
        >
          <LogInIcon class="size-4 mr-1.5" />
          Staff Sign In
        </AppButton>
        <AppButton
          to="/cases/verify-pin"
          variant="outline"
          size="default"
          class="w-full transition-all duration-300 bg-white"
        >
          <KeyRoundIcon class="size-4 mr-1.5" />
          Track Case with PIN
        </AppButton>
      </div>
    </div>

    <!-- Secondary Navigation -->
    <div class="flex items-center justify-center gap-3 pt-1">
      <AppButton
        to="/"
        variant="ghost"
        size="sm"
        class="text-xs text-muted-foreground hover:text-foreground"
      >
        <HomeIcon class="size-3.5 mr-1" />
        Return to Home
      </AppButton>
      <span class="text-border">·</span>
      <router-link
        to="/cases/submit"
        class="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
      >
        <ShieldAlertIcon class="size-3.5" />
        File a New Report
      </router-link>
    </div>
  </div>
</template>
