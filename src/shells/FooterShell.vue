<!-- shells/FooterShell.vue -->
<template>
  <footer class="border-t border-border bg-muted/40 text-foreground py-12">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <!-- Col 1: Brand & Purpose -->
        <div class="md:col-span-2 space-y-3">
          <div class="flex items-center gap-2.5">
            <div
              class="h-8 w-8 rounded-md bg-white flex items-center justify-center overflow-hidden border border-border shadow-xs">
              <img src="/verita.png" alt="Verita Logo" class="h-full w-full object-contain p-0.5" />
            </div>
            <span class="text-base font-bold tracking-tight">Verita</span>
            <span class="text-xs text-muted-foreground">· Enterprise Trust Platform</span>
          </div>
          <p class="text-xs text-muted-foreground max-w-md leading-relaxed">
            An AI-assisted case management and consultation platform designed to preserve anonymous submission,
            minimize identity exposure, and provide structured, objective review for enterprise workplace misconduct.
          </p>
          <div
            class="inline-flex items-center gap-2 rounded border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
            Aligned with ISO 37002:2021 Case Reporting Management Systems Guidelines
          </div>
        </div>

        <!-- Col 2: Public Navigation -->
        <div class="space-y-2">
          <h4 class="text-xs font-semibold text-foreground uppercase tracking-wider">Platform</h4>
          <ul class="space-y-1.5 text-xs text-muted-foreground">
            <li>
              <router-link to="/" class="hover:text-foreground transition-colors">Home</router-link>
            </li>
            <li>
              <router-link to="/about" class="hover:text-foreground transition-colors">About &amp;
                Governance</router-link>
            </li>
            <li>
              <router-link to="/cases/submit" class="hover:text-foreground transition-colors">Submit a
                Report</router-link>
            </li>
            <li>
              <router-link to="/cases/verify-pin" class="hover:text-foreground transition-colors">Track Existing
                Case</router-link>
            </li>
          </ul>
        </div>

        <!-- Col 3: Staff & Security -->
        <div class="space-y-2">
          <h4 class="text-xs font-semibold text-foreground uppercase tracking-wider">Governance</h4>
          <ul class="space-y-1.5 text-xs text-muted-foreground">
            <li>
              <router-link to="/auth/login" class="hover:text-foreground transition-colors">Staff Portal Sign
                In</router-link>
            </li>
            <li>
              <router-link to="/about#anonymity" class="hover:text-foreground transition-colors">Anonymity
                Architecture</router-link>
            </li>
            <li>
              <router-link to="/about#ai-scope" class="hover:text-foreground transition-colors">AI Processing
                Scope</router-link>
            </li>
            <li>
              <router-link to="/about#policy" class="hover:text-foreground transition-colors">Non-Retaliation
                Policy</router-link>
            </li>
            <li>
              <router-link to="/terms" class="hover:text-foreground transition-colors font-medium text-primary">Terms of
                Service</router-link>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div
        class="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>
          © {{ new Date().getFullYear() }} Verita Technologies Inc. All rights reserved. ·
          <router-link to="/terms" class="hover:text-foreground underline">Terms of Service</router-link>
        </p>
        <p class="text-[11px]">
          Confidential &amp; Encrypted · No IP Logging · Human-Led Adjudication
        </p>
      </div>
    </div>
  </footer>
</template>