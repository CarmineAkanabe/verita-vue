<!-- pages/error/NotFound.vue -->
<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'
import {
  ShieldAlertIcon,
  LockIcon,
  HomeIcon,
  ShieldCheckIcon,
  CompassIcon,
} from '@lucide/vue'

defineProps<{
  code?: number
  message?: string
}>()
</script>

<template>
  <div class="max-w-md w-full mx-auto text-center space-y-6 animate-fade-in-up">
    <!-- Floating Verita Emblem with Warm Amber Light Glow & Pulse -->
    <div class="relative inline-block animate-float">
      <!-- Outer Soft Radar / Pulse Rings -->
      <div class="absolute -inset-2 rounded-2xl bg-primary/20 blur-md animate-pulse-glow"></div>
      
      <!-- Logo Container -->
      <div class="relative h-24 w-24 sm:h-28 sm:w-28 mx-auto rounded-2xl bg-card p-2.5 shadow-xl border-2 border-primary/40 overflow-hidden group">
        <img
          src="/verita.png"
          alt="Verita Owl Emblem"
          class="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        <!-- Subtle glass sheen -->
        <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none"></div>
      </div>

      <!-- Floating Badge -->
      <div class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-[#FFFDF9]/95 backdrop-blur-md px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary border border-border shadow-xs">
          <span class="relative flex h-1.5 w-1.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
          </span>
          ERR_{{ code ?? 404 }} · NOT FOUND
        </span>
      </div>
    </div>

    <!-- Error Messaging -->
    <div class="space-y-2 pt-2">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
        Page Not Found
      </h1>
      <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
        {{ message ?? 'The destination you attempted to access does not exist, has expired, or is not available to you.' }}
      </p>
    </div>

    <!-- Security Guarantee Badge -->
    <div class="rounded-xl border border-border bg-card p-3.5 shadow-xs text-left card-hover-lift">
      <div class="flex items-start gap-2.5">
        <ShieldCheckIcon class="size-4 text-emerald-600 shrink-0 mt-0.5" />
        <div class="space-y-0.5">
          <p class="text-xs font-bold text-foreground">Privacy Protection Confirmed</p>
          <p class="text-[11px] text-muted-foreground leading-normal">
            No route trajectory, user agent, or identity metadata was logged during this invalid request.
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation Action Buttons with Micro-interactions -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
      <AppButton
        to="/"
        variant="default"
        size="default"
        class="w-full sm:w-auto shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
      >
        <HomeIcon class="size-4 mr-1.5" />
        Back to safety
      </AppButton>
      <AppButton
        to="/cases/verify-pin"
        variant="outline"
        size="default"
        class="w-full sm:w-auto transition-all duration-300 hover:-translate-y-0.5 bg-white"
      >
        <LockIcon class="size-4 mr-1.5" />
        Track case with PIN
      </AppButton>
    </div>

    <!-- Quick Help Links -->
    <div class="pt-4 border-t border-border flex items-center justify-center gap-4 text-xs text-muted-foreground">
      <router-link
        to="/cases/submit"
        class="hover:text-primary transition-colors flex items-center gap-1 font-medium"
      >
        <ShieldAlertIcon class="size-3.5 text-primary" />
        Report an incident
      </router-link>
      <span class="text-border">·</span>
      <router-link
        to="/about"
        class="hover:text-foreground transition-colors flex items-center gap-1"
      >
        <CompassIcon class="size-3.5" />
        Governance &amp; Trust
      </router-link>
    </div>
  </div>
</template>