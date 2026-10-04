<!-- layouts/ErrorLayout.vue -->
<script setup lang="ts">
import { ShieldCheckIcon } from '@lucide/vue'
import RouteTransition from '@/components/common/RouteTransition.vue'
</script>

<template>
  <div class="relative min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
    <!-- Subtle Background Ambient Accents -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-muted/60 blur-3xl"></div>
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    </div>

    <!-- Minimal Header with Verita Logo -->
    <header class="relative z-10 w-full border-b border-border bg-[#EFE6D8] shadow-xs">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <router-link to="/" class="flex items-center gap-2.5 group">
          <div class="h-8 w-8 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-border shadow-xs group-hover:scale-105 group-hover:border-primary/60 transition-all duration-300">
            <img src="/verita.png" alt="Verita Logo" class="h-full w-full object-contain p-0.5" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              Verita
            </span>
            <span class="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              Enterprise Trust Platform
            </span>
          </div>
        </router-link>

        <router-link
          to="/"
          class="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Return to platform &rarr;
        </router-link>
      </div>
    </header>

    <!-- Main Centered Content -->
    <main class="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-8">
      <RouteTransition />
    </main>

    <!-- Minimal Secure Footer -->
    <footer class="relative z-10 border-t border-border/60 py-4 bg-background/80 text-center text-xs text-muted-foreground">
      <div class="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
        <div class="flex items-center gap-1.5">
          <ShieldCheckIcon class="size-3.5 text-primary" />
          <span>Anonymous by Design · Zero Metadata Retention</span>
        </div>
        <p>© {{ new Date().getFullYear() }} Verita Technologies Inc.</p>
      </div>
    </footer>
  </div>
</template>