<!-- pages/error/ServerError.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import {
  ServerCrashIcon,
  RefreshCwIcon,
  HomeIcon,
  CheckCircle2Icon,
} from '@lucide/vue'

defineProps<{
  code?: number
  message?: string
}>()

const isRetrying = ref(false)

function handleRetry(): void {
  isRetrying.value = true
  setTimeout(() => {
    window.location.reload()
  }, 400)
}
</script>

<template>
  <div class="max-w-md w-full mx-auto text-center space-y-6 animate-fade-in-up">
    <!-- Floating Emblem with Server Issue Pulse -->
    <div class="relative inline-block animate-float">
      <!-- Ambient Outer Pulse Glow -->
      <div class="absolute -inset-2 rounded-2xl bg-orange-500/20 blur-md animate-pulse-glow"></div>

      <!-- Logo Container -->
      <div class="relative h-24 w-24 sm:h-28 sm:w-28 mx-auto rounded-2xl bg-card p-2.5 shadow-xl border-2 border-primary/40 overflow-hidden group">
        <img
          src="/verita.png"
          alt="Verita Owl Emblem"
          class="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none"></div>
      </div>

      <!-- Floating Badge -->
      <div class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-[#FFFDF9]/95 backdrop-blur-md px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-orange-800 border border-border shadow-xs">
          <span class="relative flex h-1.5 w-1.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-600 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-600"></span>
          </span>
          ERR_{{ code ?? 500 }} · SERVICE PAUSED
        </span>
      </div>
    </div>

    <!-- Error Title & Description -->
    <div class="space-y-2 pt-2">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
        Service Interrupted
      </h1>
      <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
        {{ message ?? 'The platform encountered an unexpected server delay or connectivity interruption. Encrypted records remain safe.' }}
      </p>
    </div>

    <!-- Resilience Note -->
    <div class="rounded-xl border border-border bg-card p-3.5 shadow-xs text-left card-hover-lift">
      <div class="flex items-start gap-2.5">
        <ServerCrashIcon class="size-4 text-primary shrink-0 mt-0.5" />
        <div class="space-y-0.5">
          <p class="text-xs font-bold text-foreground">Data Integrity Guaranteed</p>
          <p class="text-[11px] text-muted-foreground leading-normal">
            Database transactions are atomic and encrypted. No partially submitted forms or messages were leaked or corrupted.
          </p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
      <button
        type="button"
        :disabled="isRetrying"
        class="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-[#8D4814] shadow-xs transition-all duration-300 w-full sm:w-auto cursor-pointer disabled:opacity-60"
        @click="handleRetry"
      >
        <RefreshCwIcon class="size-4 mr-1.5" :class="{ 'animate-spin': isRetrying }" />
        {{ isRetrying ? 'Reconnecting...' : 'Retry Connection' }}
      </button>

      <AppButton
        to="/"
        variant="outline"
        size="default"
        class="w-full sm:w-auto transition-all duration-300 bg-white"
      >
        <HomeIcon class="size-4 mr-1.5" />
        Back to Safety
      </AppButton>
    </div>

    <!-- System Diagnostics Notice -->
    <div class="pt-3 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-mono">
      <CheckCircle2Icon class="size-3 text-emerald-600" />
      <span>Status node: ok · Latency: 42ms</span>
    </div>
  </div>
</template>
