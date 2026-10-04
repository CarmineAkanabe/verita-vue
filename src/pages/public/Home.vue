<!-- pages/public/Home.vue -->
<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import {
  ShieldAlertIcon,
  LockIcon,
  FileCheck2Icon,
  UsersIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ScaleIcon,
  CheckCircle2Icon,
  TriangleAlertIcon,
  Building2Icon,
  SparklesIcon,
  AwardIcon,
  BadgeCheckIcon,
} from '@lucide/vue'
</script>

<template>
  <div class="flex flex-col bg-background text-foreground">
    <!-- Hero Section with Animation & Photographic Asset -->
    <section class="border-b border-border bg-muted/20 py-14 lg:py-20 overflow-hidden">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <!-- Hero Left Column -->
          <div class="lg:col-span-7 space-y-6 animate-fade-in-up">
            <!-- Live Security Status Tag with Pulse Indicator -->
            <div
              class="inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-xs">
              <span class="relative flex h-2 w-2">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span class="text-foreground tracking-wide font-medium">Private &amp; Confidential Intake Active</span>
              <span class="text-border">|</span>
              <span class="text-[11px] text-primary font-mono font-bold">100% ANONYMOUS</span>
            </div>

            <!-- Headline -->
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
              Integrity and accountability for the modern enterprise
            </h1>

            <!-- Subtext -->
            <p class="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Verita is a secure and anonymous case reporting platform. Safely report workplace misconduct,
              financial discrepancies, or ethical concerns with complete privacy. No account or email required.
              Submissions are organized with helpful AI assistance and investigated directly by human leaders.
            </p>

            <!-- Actions Row with micro-interactions -->
            <div class="flex flex-wrap items-center gap-4 pt-2">
              <AppButton to="/cases/submit" size="lg" variant="default"
                class="shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <ShieldAlertIcon class="size-5 mr-2" />
                Report an incident
              </AppButton>
              <AppButton to="/cases/verify-pin" size="lg" variant="outline"
                class="transition-all duration-300 hover:-translate-y-0.5">
                Track a case
              </AppButton>
              <router-link to="/auth/login"
                class="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground pl-2 transition-colors">
                Staff sign in
                <ArrowRightIcon class="size-4 group-hover:translate-x-1 transition-transform" />
              </router-link>
            </div>

            <!-- Trust Micro-indicators -->
            <div
              class="pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div class="flex items-center gap-2">
                <ShieldCheckIcon class="size-4 text-primary shrink-0" />
                <span>Zero IP or device logging</span>
              </div>
              <div class="flex items-center gap-2">
                <LockIcon class="size-4 text-primary shrink-0" />
                <span>One-time cryptographic PIN</span>
              </div>
              <div class="flex items-center gap-2">
                <ScaleIcon class="size-4 text-primary shrink-0" />
                <span>100% human-led decisions</span>
              </div>
            </div>
          </div>

          <!-- Hero Right Column: High-Resolution Corporate Photography with Floating Badges -->
          <div class="lg:col-span-5 animate-fade-in">
            <div
              class="group relative rounded-xl border border-border bg-card p-2 shadow-lg transition-all duration-500 hover:shadow-xl hover:border-primary/40">
              <!-- Photo Container with Hover Zoom -->
              <div class="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-border/80 bg-muted/40">
                <img src="/hero-enterprise.jpg" alt="Enterprise Ethics and Governance Consultation"
                  class="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="eager" />

                <!-- Top Floating Live Badge -->
                <div
                  class="absolute top-3 left-3 bg-background/90 backdrop-blur-md border border-border/80 rounded-md px-3 py-1.5 shadow-sm flex items-center gap-2">
                  <span class="relative flex h-2 w-2">
                    <span
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span class="text-xs font-semibold text-foreground">Encrypted Intake Vault</span>
                </div>

                <!-- Bottom Floating Verification Tag -->
                <div
                  class="absolute bottom-3 right-3 left-3 bg-card/95 backdrop-blur-md border border-border/80 rounded-lg p-3 shadow-md">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="h-7 w-7 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <LockIcon class="size-3.5" />
                      </div>
                      <div>
                        <p class="text-xs font-bold text-foreground">Confidential &amp; Anonymous</p>
                        <p class="text-[10px] text-muted-foreground">No tracking · Private PIN</p>
                      </div>
                    </div>
                    <span
                      class="font-mono text-[10px] font-bold bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                      PROTECTED
                    </span>
                  </div>
                </div>
              </div>

              <!-- Sub-card Caption -->
              <div class="pt-3 px-3 pb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span class="font-medium text-foreground">Enterprise Trust Infrastructure</span>
                <span class="flex items-center gap-1 text-primary font-medium">
                  <BadgeCheckIcon class="size-3.5" /> Human-in-the-Loop
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Enterprise Trust & Client Bar (Social Proof) -->
    <section class="border-b border-border bg-background py-8">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p class="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
          Trusted by governance &amp; compliance leaders across industries
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 items-center justify-items-center opacity-80">
          <div
            class="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
            <Building2Icon class="size-4 text-primary" />
            <span>Digimark Consulting</span>
          </div>
          <div
            class="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
            <ScaleIcon class="size-4 text-muted-foreground" />
            <span>Apex Global Partners</span>
          </div>
          <div
            class="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
            <AwardIcon class="size-4 text-muted-foreground" />
            <span>Meridian Capital</span>
          </div>
          <div
            class="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
            <ShieldCheckIcon class="size-4 text-muted-foreground" />
            <span>Stratum Health</span>
          </div>
          <div
            class="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
            <SparklesIcon class="size-4 text-muted-foreground" />
            <span>Vanguard Systems</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Three Trust Feature Cards Section -->
    <section class="py-16 lg:py-20 bg-background">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl mb-12">
          <div class="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Protected Architecture
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            A protected, objective framework for reporting sensitive concerns
          </h2>
          <p class="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Designed specifically to eliminate fear of retaliation, narrow the substantiation gap,
            and ensure every allegation receives unbiased examination.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Card 1: Anonymous Reporting -->
          <AppCard cardClass="border-border bg-card card-creamy shadow-xs" contentClass="space-y-4">
            <template #header>
              <div
                class="h-10 w-10 rounded-lg border border-border bg-primary/10 flex items-center justify-center mb-3 text-primary">
                <LockIcon class="size-5" />
              </div>
              <h3 class="text-lg font-bold tracking-tight text-foreground">
                1. Anonymous Case Reporting
              </h3>
            </template>
            <p class="text-sm text-muted-foreground leading-relaxed">
              No account, work email, or registration required. Submissions are identified only
              by a unique Case ID and a private 6-digit PIN, ensuring complete confidentiality.
            </p>
            <ul class="space-y-2 text-xs text-foreground pt-2 border-t border-border">
              <li class="flex items-center gap-2">
                <CheckCircle2Icon class="size-3.5 text-primary shrink-0" />
                <span>Zero personal or device tracking</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckCircle2Icon class="size-3.5 text-primary shrink-0" />
                <span>Secure encrypted file attachments</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckCircle2Icon class="size-3.5 text-primary shrink-0" />
                <span>Private 2-way consultation chat</span>
              </li>
            </ul>
          </AppCard>

          <!-- Card 2: AI-Assisted Structuring -->
          <AppCard cardClass="border-border bg-card card-creamy shadow-xs" contentClass="space-y-4">
            <template #header>
              <div
                class="h-10 w-10 rounded-lg border border-border bg-primary/10 flex items-center justify-center mb-3 text-primary">
                <FileCheck2Icon class="size-5" />
              </div>
              <h3 class="text-lg font-bold tracking-tight text-foreground">
                2. AI-Assisted Organization
              </h3>
            </template>
            <p class="text-sm text-muted-foreground leading-relaxed">
              AI automatically organizes incident statements and uploaded proof into a
              clear timeline and highlights missing information.
              <strong>The AI never judges guilt or makes decisions.</strong>
            </p>
            <ul class="space-y-2 text-xs text-foreground pt-2 border-t border-border">
              <li class="flex items-center gap-2">
                <CheckCircle2Icon class="size-3.5 text-primary shrink-0" />
                <span>Automatic chronological timeline</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckCircle2Icon class="size-3.5 text-primary shrink-0" />
                <span>Highlights missing details &amp; discrepancies</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckCircle2Icon class="size-3.5 text-primary shrink-0" />
                <span>100% human investigator decisions</span>
              </li>
            </ul>
          </AppCard>

          <!-- Card 3: Department Head Review -->
          <AppCard cardClass="border-border bg-card card-creamy shadow-xs" contentClass="space-y-4">
            <template #header>
              <div
                class="h-10 w-10 rounded-lg border border-border bg-primary/10 flex items-center justify-center mb-3 text-primary">
                <UsersIcon class="size-5" />
              </div>
              <h3 class="text-lg font-bold tracking-tight text-foreground">
                3. Confidential Department Review
              </h3>
            </template>
            <p class="text-sm text-muted-foreground leading-relaxed">
              Cases route securely to the relevant department head. Leaders review the facts,
              communicate directly via anonymous chat, and resolve matters fairly.
            </p>
            <ul class="space-y-2 text-xs text-foreground pt-2 border-t border-border">
              <li class="flex items-center gap-2">
                <CheckCircle2Icon class="size-3.5 text-primary shrink-0" />
                <span>Department Head bypass option</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckCircle2Icon class="size-3.5 text-primary shrink-0" />
                <span>Secure, audited investigation records</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckCircle2Icon class="size-3.5 text-primary shrink-0" />
                <span>Manager oversight</span>
              </li>
            </ul>
          </AppCard>
        </div>
      </div>
    </section>

    <!-- Customer Spotlight: Digimark Consulting Case Study Section -->
    <section class="py-16 lg:py-24 border-t border-border bg-muted/30">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <!-- Case Study Image with Hover Zoom -->
          <div class="lg:col-span-6">
            <div
              class="group relative rounded-xl border border-border bg-card p-2 shadow-md overflow-hidden card-hover-lift">
              <div class="aspect-[16/10] w-full rounded-lg overflow-hidden bg-muted/50 relative">
                <img src="/case-study-digimark.jpg" alt="Digimark Consulting Advisory Team"
                  class="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy" />
                <div
                  class="absolute top-3 left-3 bg-background/90 backdrop-blur-md border border-border/80 rounded-md px-3 py-1 text-xs font-semibold text-foreground shadow-xs">
                  Case Study · Management Consulting
                </div>
              </div>
              <div class="p-3 text-xs text-muted-foreground flex items-center justify-between">
                <span>Enterprise Customer Spotlight</span>
                <span class="font-medium text-foreground">Digimark Consulting</span>
              </div>
            </div>
          </div>

          <!-- Case Study Narrative -->
          <div class="lg:col-span-6 space-y-6">
            <div
              class="inline-flex items-center gap-2 rounded border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Building2Icon class="size-3.5" />
              Customer Spotlight
            </div>

            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              How Digimark Consulting replaced informal channels with auditable trust
            </h2>

            <p class="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Operating across multiple regional offices without a centralized HR department,
              <strong>Digimark Consulting</strong> previously relied on informal handling by team leads.
              This created hesitation among its 250+ consultants, leaving critical financial and conduct concerns
              unreported.
            </p>

            <p class="text-sm text-muted-foreground leading-relaxed">
              By implementing Verita, Digimark deployed an anonymous intake portal where employees submit
              disclosures without corporate logins. Structured AI assistance ensures allegations are organized
              chronologically,
              while leadership conducts objective, conflict-screened investigations under ISO 37002:2021.
            </p>

            <!-- Case Study Key Metrics -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-border">
              <div>
                <p class="text-2xl font-bold text-primary">100%</p>
                <p class="text-[11px] text-muted-foreground">Anonymous Protection</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-foreground">0</p>
                <p class="text-[11px] text-muted-foreground">Retaliation Incidents</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-foreground">14 Days</p>
                <p class="text-[11px] text-muted-foreground">Avg. Resolution</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-primary">ISO 37002</p>
                <p class="text-[11px] text-muted-foreground">Aligned Workflow</p>
              </div>
            </div>

            <!-- Customer Testimonial Quote -->
            <div class="rounded-lg border border-border/80 bg-background p-4 space-y-2">
              <p class="text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
                "Verita solved the core dilemma in our growing firm: providing consultants with genuine psychological
                safety
                while giving executive partners clear, auditable evidence to act decisively."
              </p>
              <p class="text-xs font-semibold text-foreground">
                — Head of Risk &amp; Governance, Digimark Consulting
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works: 3-Step Process Bar with Animations -->
    <section id="how-it-works" class="py-16 lg:py-20 border-y border-border bg-background">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <div class="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Intake Process
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            How verification &amp; follow-up works
          </h2>
          <p class="mt-2 text-sm text-muted-foreground">
            Three simple steps to report misconduct without ever revealing your personal identity.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Step 1 -->
          <div class="rounded-xl border border-border bg-card card-creamy p-6 space-y-3 shadow-xs">
            <div class="flex items-center justify-between">
              <span
                class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm shadow-xs">
                1
              </span>
              <span class="text-xs font-mono text-muted-foreground">SUBMIT</span>
            </div>
            <h3 class="text-base font-bold text-foreground">Submit Your Report</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Follow the 4-step guided form: select the department, provide details and amount, describe what occurred,
              and upload any receipts or files.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="rounded-xl border border-border bg-card card-creamy p-6 space-y-3 shadow-xs">
            <div class="flex items-center justify-between">
              <span
                class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background font-bold text-sm shadow-xs">
                2
              </span>
              <span class="text-xs font-mono text-muted-foreground">CREDENTIALS</span>
            </div>
            <h3 class="text-base font-bold text-foreground">Save Your Tracking PIN</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Upon submission, you receive your <strong>Case ID</strong> and a <strong>Tracking PIN</strong>.
              Keep these safe to check case progress and view responses.
            </p>
          </div>

          <!-- Step 3 -->
          <div class="rounded-xl border border-border bg-card card-creamy p-6 space-y-3 shadow-xs">
            <div class="flex items-center justify-between">
              <span
                class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background font-bold text-sm shadow-xs">
                3
              </span>
              <span class="text-xs font-mono text-muted-foreground">CHAT &amp; UPDATES</span>
            </div>
            <h3 class="text-base font-bold text-foreground">Track Progress &amp; Chat</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Log back in anytime with your PIN. View the incident timeline, check findings, and communicate
              safely with the assigned investigator.
            </p>
          </div>
        </div>

        <div class="mt-10 text-center">
          <AppButton to="/cases/submit" variant="default" size="lg"
            class="shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            Start a confidential report now
            <ArrowRightIcon class="size-4 ml-2" />
          </AppButton>
        </div>
      </div>
    </section>

    <!-- Non-Retaliation Policy Reassurance Banner -->
    <section class="py-12 bg-muted/20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          class="rounded-lg border-l-4 border-l-primary border-y border-r border-border bg-card p-6 sm:p-8 card-hover-lift shadow-xs">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-2 max-w-3xl">
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                <TriangleAlertIcon class="size-4 text-warning" />
                Enterprise Non-Retaliation Guarantee
              </div>
              <p class="text-sm text-muted-foreground leading-relaxed">
                Verita partner enterprises maintain a strict, auditable zero-tolerance policy against any form of
                retaliation,
                demotion, or adverse employment action targeting employees, interns, or contractors reporting in good
                faith.
                All reports are handled with utmost discretion under ISO 37002:2021 case reporting management standards.
              </p>
            </div>
            <div class="shrink-0">
              <AppButton to="/about#policy" variant="outline" size="sm">
                Read policy details &rarr;
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Secondary Call to Action -->
    <section class="py-16 border-t border-border bg-card">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Ready to submit or check an existing case?
        </h2>
        <p class="text-sm text-muted-foreground max-w-xl mx-auto">
          Choose an option below to proceed. You do not need to register or provide identifying details to make a
          report.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4 pt-4">
          <AppButton to="/cases/submit" size="lg" variant="default"
            class="shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <ShieldAlertIcon class="size-5 mr-2" />
            Report an incident
          </AppButton>
          <AppButton to="/cases/verify-pin" size="lg" variant="outline"
            class="transition-all duration-300 hover:-translate-y-0.5">
            Track a case with PIN
          </AppButton>
        </div>
      </div>
    </section>
  </div>
</template>
