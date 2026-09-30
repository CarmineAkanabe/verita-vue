<!-- pages/public/About.vue -->
<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import {
  ShieldCheckIcon,
  OctagonAlertIcon,
  CpuIcon,
  ScaleIcon,
  Building2Icon,
  BookOpenIcon,
  CheckCircle2Icon,
  LockIcon,
  ArrowRightIcon,
  ShieldAlertIcon,
  ActivityIcon,
  Code2Icon,
  ExternalLinkIcon,
} from '@lucide/vue'
</script>

<template>
  <div class="flex flex-col bg-background text-foreground">
    <!-- About Hero -->
    <section class="border-b border-border bg-muted/20 py-16 lg:py-20">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4 animate-fade-in-up">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-xs">
          <BookOpenIcon class="size-3.5 text-primary" />
          Enterprise Governance &amp; Ethics Standard
        </div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          About Verita: Integrity, Accountability, and Discretion
        </h1>
        <p class="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          How Verita provides a secure, structured, and objective framework for reporting workplace misconduct
          and financial irregularities across modern enterprises while guaranteeing reporter anonymity.
        </p>
      </div>
    </section>

    <!-- Main Content Body -->
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <!-- Section 1: The Institutional Dilemma & Enterprise Context (Case Example: Digimark) -->
      <section class="space-y-6">
        <div class="flex items-center gap-3">
          <div
            class="h-9 w-9 rounded-lg border border-border bg-primary/10 flex items-center justify-center text-primary">
            <Building2Icon class="size-5" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-foreground">The Enterprise Dilemma: From Informal Handling to Auditable
              Trust</h2>
            <p class="text-xs text-muted-foreground">Bridging informal handling with enterprise-grade compliance</p>
          </div>
        </div>

        <div class="prose text-sm text-muted-foreground leading-relaxed space-y-4">
          <p>
            In many fast-growing technology, consulting, and service enterprises—such as our featured customer
            <strong>Digimark Consulting</strong>—organizations operate without a centralized, bureaucratic human
            resources apparatus.
            Historically, conduct issues, procurement conflicts, or financial discrepancies were absorbed informally by
            whoever was closest: a practice lead, a project manager, or an executive partner.
          </p>
          <p>
            This informal model introduces severe systemic friction: reporters fear interpersonal retaliation or career
            penalties,
            disclosures lack verifiable evidence trails, and management lacks an objective, auditable record.
            Even in larger enterprises with established HR departments, reporting to an internal HR representative often
            feels
            identity-exposing and fraught with corporate conflicts of interest.
          </p>
          <p>
            <strong>Verita</strong> was built to solve this exact dilemma—providing an air-gapped, neutral, and
            cryptographically
            isolated channel for intake, investigation, and structured resolution.
          </p>
        </div>

        <!-- Why Anonymous Reporting Matters Card -->
        <AppCard cardClass="border-border bg-card card-creamy shadow-xs">
          <template #header>
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <CheckCircle2Icon class="size-4" />
              Core Principle
            </div>
            <h3 class="text-base font-bold text-foreground">
              Why Confidential Case Reporting Matters
            </h3>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-muted-foreground">
            <div class="space-y-2 border-l-2 border-primary pl-4">
              <p class="font-semibold text-foreground">Eliminating Fear of Retaliation</p>
              <p>
                Staff and consultants often hesitate to speak up when reporting requires their personal name or email.
                Verita provides a safe, anonymous channel where concerns can be raised without fear of career harm.
              </p>
            </div>
            <div class="space-y-2 border-l-2 border-border pl-4">
              <p class="font-semibold text-foreground">Clear Proof and Direct Follow-Up</p>
              <p>
                Anonymous reports often fail when investigators cannot ask follow-up questions.
                Verita solves this with private, anonymous two-way chat and clear AI chronological timelines.
              </p>
            </div>
          </div>
        </AppCard>
      </section>

      <!-- Section 2: Anonymity Architecture with Photography Asset -->
      <section id="anonymity" class="space-y-6 pt-6 border-t border-border">
        <div class="flex items-center gap-3">
          <div
            class="h-9 w-9 rounded-lg border border-border bg-primary/10 flex items-center justify-center text-primary">
            <LockIcon class="size-5" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-foreground">Anonymity Architecture &amp; Cryptographic Disclosures</h2>
            <p class="text-xs text-muted-foreground">Preserving anonymous submission and minimizing identity exposure
            </p>
          </div>
        </div>

        <div class="text-sm text-muted-foreground leading-relaxed space-y-4">
          <p>
            In strict alignment with academic ethics and data privacy principles, Verita does not promise absolute or
            "magic"
            anonymity.
            Instead, our architecture focuses on <strong>preserving anonymous submission and minimizing identity
              exposure</strong>
            across two distinct dimensions:
          </p>
        </div>

        <!-- Security Operations Photographic Showcase -->
        <div
          class="group relative rounded-xl border border-border bg-card p-2 shadow-md overflow-hidden card-hover-lift">
          <div class="aspect-[21/9] sm:aspect-[24/9] w-full rounded-lg overflow-hidden bg-muted/40 relative">
            <img src="/security-operations.jpg" alt="Enterprise Security and Compliance Center"
              class="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy" />
            <div
              class="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex items-end p-4 sm:p-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                <div>
                  <p class="text-xs font-bold text-foreground uppercase tracking-wider">Air-Gapped Ingestion Pipeline
                  </p>
                  <p class="text-[11px] text-muted-foreground">Zero persistent session tokens · Hardware-isolated
                    database
                    encryption</p>
                </div>
                <span
                  class="inline-flex items-center gap-1.5 rounded bg-background/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono font-medium border border-border">
                  <ActivityIcon class="size-3 text-emerald-500" />
                  AES-256 / SHA-256
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Metadata level -->
          <div class="rounded-xl border border-border bg-card card-creamy p-6 space-y-3 shadow-xs">
            <div class="flex items-center gap-2">
              <ShieldCheckIcon class="size-5 text-emerald-600" />
              <h3 class="text-sm font-bold text-foreground">1. What Verita Protects Automatically</h3>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              We never record your IP address, browser type, or device details. You do not need to create an account
              or log in with work credentials. Access to your report is protected only by your unique Case ID and
              private PIN.
            </p>
          </div>

          <!-- Content level caveat -->
          <div class="rounded-xl border border-warning/40 bg-warning/5 p-6 space-y-3 shadow-xs">
            <div class="flex items-center gap-2">
              <OctagonAlertIcon class="size-5 text-warning" />
              <h3 class="text-sm font-bold text-foreground">2. Important Tip When Uploading Files</h3>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              We protect system metadata, but <strong>cannot remove personal details inside your files</strong>.
              If uploading screenshots or payment receipts, please cover or crop your personal name or account numbers
              first.
            </p>
          </div>
        </div>
      </section>

      <!-- Section 3: AI Processing Scope & Strict Ethical Boundaries -->
      <section id="ai-scope" class="space-y-6 pt-6 border-t border-border">
        <div class="flex items-center gap-3">
          <div
            class="h-9 w-9 rounded-lg border border-border bg-primary/10 flex items-center justify-center text-primary">
            <CpuIcon class="size-5" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-foreground">AI Processing Scope &amp; Non-Judgment Guarantee</h2>
            <p class="text-xs text-muted-foreground">Gemini AI structures evidence — humans decide outcomes</p>
          </div>
        </div>

        <p class="text-sm text-muted-foreground leading-relaxed">
          Artificial Intelligence in Verita is utilized strictly as an organizational assistant, not an automated
          tribunal.
          The system enforces strict algorithmic guardrails:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="rounded-xl border border-border bg-card card-creamy p-5 space-y-3 shadow-xs">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">What the AI Does</h3>
            <ul class="space-y-2 text-xs text-foreground">
              <li class="flex items-start gap-2">
                <CheckCircle2Icon class="size-4 text-primary shrink-0 mt-0.5" />
                <span>Builds a chronological timeline from statements, chat logs, and receipts.</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckCircle2Icon class="size-4 text-primary shrink-0 mt-0.5" />
                <span>Checks for completeness: date, amount, purpose, and parties involved.</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckCircle2Icon class="size-4 text-primary shrink-0 mt-0.5" />
                <span>Highlights factual differences between reported descriptions and attached proof.</span>
              </li>
            </ul>
          </div>

          <div class="rounded-xl border border-border bg-card card-creamy p-5 space-y-3 shadow-xs">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-destructive">What the AI Never Does</h3>
            <ul class="space-y-2 text-xs text-muted-foreground">
              <li class="flex items-start gap-2">
                <span class="text-destructive font-bold">✕</span>
                <span>Never calculates credibility scores, guilt probabilities, or risk ratings.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-destructive font-bold">✕</span>
                <span>Never decides whether misconduct occurred.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-destructive font-bold">✕</span>
                <span>Never recommends disciplinary actions, sanctions, or case outcomes.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Section 4: Governance, Separation of Powers, and ISO 37002:2021 -->
      <section id="policy" class="space-y-6 pt-6 border-t border-border">
        <div class="flex items-center gap-3">
          <div
            class="h-9 w-9 rounded-lg border border-border bg-primary/10 flex items-center justify-center text-primary">
            <ScaleIcon class="size-5" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-foreground">Investigative Governance &amp; Access Controls</h2>
            <p class="text-xs text-muted-foreground">Access follows responsibility, not organizational rank</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="rounded-xl border border-border bg-card card-creamy p-5 space-y-2 shadow-xs">
            <h3 class="text-sm font-bold text-foreground">Department Heads</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Assigned based on the department involved. Department Heads review the evidence,
              communicate directly with reporters in private chat, and record resolutions.
            </p>
          </div>

          <div class="rounded-xl border border-border bg-card card-creamy p-5 space-y-2 shadow-xs">
            <h3 class="text-sm font-bold text-foreground">Managers</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Provides organization oversight, creates departments and accounts, and assigns cases where the Department Head is conflicted.
            </p>
          </div>

          <div class="rounded-xl border border-border bg-card card-creamy p-5 space-y-2 shadow-xs">
            <h3 class="text-sm font-bold text-foreground">Escalation Protection</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              If an assigned reviewer is unresponsive or dismissive, the Case Reporter can escalate the case
              directly to Managers.
            </p>
          </div>
        </div>

        <!-- ISO 37002 Cycle -->
        <div class="rounded-lg border border-border bg-muted/30 p-6 space-y-3 card-hover-lift">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-foreground">
            ISO 37002:2021 Case Reporting Management Standard Alignment
          </h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Verita implements the recognized four-stage international standard:
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div class="border-t-2 border-primary pt-2">
              <span class="text-xs font-bold text-foreground">1. Receiving</span>
              <p class="text-[11px] text-muted-foreground">Encrypted intake, zero-log submission, one-time PIN.</p>
            </div>
            <div class="border-t-2 border-primary pt-2">
              <span class="text-xs font-bold text-foreground">2. Assessing</span>
              <p class="text-[11px] text-muted-foreground">AI timeline structuring, triage, conflict-of-interest check.
              </p>
            </div>
            <div class="border-t-2 border-primary pt-2">
              <span class="text-xs font-bold text-foreground">3. Addressing</span>
              <p class="text-[11px] text-muted-foreground">Department Head review, two-way anonymous chat, further
                evidence.
              </p>
            </div>
            <div class="border-t-2 border-primary pt-2">
              <span class="text-xs font-bold text-foreground">4. Concluding</span>
              <p class="text-[11px] text-muted-foreground">Resolution notes, immutable audit logs, disciplinary
                referral.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 5: Engineering Leadership & Architecture -->
      <section class="space-y-6">
        <div class="flex items-center gap-3">
          <div
            class="h-9 w-9 rounded-lg border border-border bg-primary/10 flex items-center justify-center text-primary">
            <Code2Icon class="size-5" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-foreground">Platform Architecture &amp; Engineering</h2>
            <p class="text-xs text-muted-foreground">Lead engineering, systems architecture, and open-source provenance
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-[#E2D5C3] bg-[#F8F3EA] p-6 sm:p-8 card-hover-lift shadow-xs space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                  Lead Architect &amp; Core Engineer
                </span>
                <span class="text-xs text-muted-foreground font-mono">
                  Full-Stack Development
                </span>
              </div>
              <h3 class="text-xl font-bold text-foreground">
                Carmine Akanabe
              </h3>
              <p class="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Architected and developed the Verita ecosystem — including zero-retention anonymous intake pipelines,
                role-partitioned JWT authentication, real-time WebSocket communication via Laravel Reverb,
                and ISO 37002-aligned immutable cryptographic audit tracking.
              </p>
            </div>

            <!-- GitHub Profile Badge Link -->
            <a href="https://github.com/CarmineAkanabe" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#22293A] text-white hover:bg-[#1B212F] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 shrink-0 group border border-slate-700">
              <svg class="size-4 text-white fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <div class="text-left">
                <p
                  class="text-[11px] font-semibold leading-tight text-white group-hover:text-amber-400 transition-colors">
                  CarmineAkanabe
                </p>
                <p class="text-[10px] text-slate-400 font-mono">
                  GitHub Profile &rarr;
                </p>
              </div>
              <ExternalLinkIcon class="size-3.5 text-slate-400 group-hover:text-white transition-colors ml-1" />
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E2D5C3]/70 text-xs">
            <div class="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2Icon class="size-3.5 text-emerald-600 shrink-0" />
              <span>Full-Stack Laravel &amp; Vue 3</span>
            </div>
            <div class="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2Icon class="size-3.5 text-emerald-600 shrink-0" />
              <span>Air-Gapped Privacy Architecture</span>
            </div>
            <div class="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2Icon class="size-3.5 text-emerald-600 shrink-0" />
              <span>Cryptographic Audit Trails</span>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Footer Box -->
      <section
        class="rounded-xl border border-border bg-card p-8 sm:p-10 text-center space-y-4 card-hover-lift shadow-sm">
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Ready to submit a confidential report?
        </h2>
        <p class="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Your disclosure preserves ethical standards and accountability across partner enterprises.
          No email, corporate login, or identity disclosure is required.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4 pt-2">
          <AppButton to="/cases/submit" size="default" variant="default"
            class="shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <ShieldAlertIcon class="size-4 mr-1.5" />
            Report an incident
          </AppButton>
          <AppButton to="/cases/verify-pin" size="default" variant="outline"
            class="transition-all duration-300 hover:-translate-y-0.5">
            Track an existing case
            <ArrowRightIcon class="size-4 ml-1.5" />
          </AppButton>
        </div>
      </section>
    </div>
  </div>
</template>
