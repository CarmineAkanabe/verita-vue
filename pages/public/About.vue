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
} from '@lucide/vue'
</script>

<template>
  <div class="flex flex-col bg-background text-foreground">
    <!-- About Hero -->
    <section class="border-b border-border bg-muted/20 py-16 lg:py-20">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4 animate-fade-in-up">
        <div class="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-xs">
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
          <div class="h-9 w-9 rounded-lg border border-border bg-primary/10 flex items-center justify-center text-primary">
            <Building2Icon class="size-5" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-foreground">The Enterprise Dilemma: From Informal Handling to Auditable Trust</h2>
            <p class="text-xs text-muted-foreground">Bridging informal handling with enterprise-grade compliance</p>
          </div>
        </div>

        <div class="prose text-sm text-muted-foreground leading-relaxed space-y-4">
          <p>
            In many fast-growing technology, consulting, and service enterprises—such as our featured customer
            <strong>Digimark Consulting</strong>—organizations operate without a centralized, bureaucratic human resources apparatus.
            Historically, conduct issues, procurement conflicts, or financial discrepancies were absorbed informally by
            whoever was closest: a practice lead, a project manager, or an executive partner.
          </p>
          <p>
            This informal model introduces severe systemic friction: reporters fear interpersonal retaliation or career penalties,
            disclosures lack verifiable evidence trails, and management lacks an objective, auditable record.
            Even in larger enterprises with established HR departments, reporting to an internal HR representative often feels
            identity-exposing and fraught with corporate conflicts of interest.
          </p>
          <p>
            <strong>Verita</strong> was built to solve this exact dilemma—providing an air-gapped, neutral, and cryptographically
            isolated channel for intake, investigation, and structured resolution.
          </p>
        </div>

        <!-- Academic & Industry Research Card with Hover Lift -->
        <AppCard cardClass="border-border bg-card card-hover-lift">
          <template #header>
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <CheckCircle2Icon class="size-4" />
              Verified Anonymity Research
            </div>
            <h3 class="text-base font-bold text-foreground">
              Narrowing the Substantiation Gap
            </h3>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-muted-foreground">
            <div class="space-y-2 border-l-2 border-primary pl-4">
              <p class="font-semibold text-foreground">Stubben &amp; Welch (2020) — Journal of Accounting Research</p>
              <p>
                In an empirical study of over 2 million internal enterprise reports, <strong>28.5%</strong> of employees chose to remain anonymous,
                rising to <strong>35.4%</strong> specifically for accounting and financial fraud matters.
              </p>
            </div>
            <div class="space-y-2 border-l-2 border-border pl-4">
              <p class="font-semibold text-foreground">NAVEX Whistleblowing Benchmark (2023)</p>
              <p>
                While anonymous reports constitute over 56% of enterprise intakes, historically only 33% reached substantiation
                compared to 50% for named reports—due to missing evidence and lack of follow-up. Verita closes this 17-point gap
                with AI timeline structuring and persistent anonymous two-way chat.
              </p>
            </div>
          </div>
        </AppCard>
      </section>

      <!-- Section 2: Anonymity Architecture with Photography Asset -->
      <section id="anonymity" class="space-y-6 pt-6 border-t border-border">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-lg border border-border bg-primary/10 flex items-center justify-center text-primary">
            <LockIcon class="size-5" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-foreground">Anonymity Architecture &amp; Cryptographic Disclosures</h2>
            <p class="text-xs text-muted-foreground">Preserving anonymous submission and minimizing identity exposure</p>
          </div>
        </div>

        <div class="text-sm text-muted-foreground leading-relaxed space-y-4">
          <p>
            In strict alignment with academic ethics and data privacy principles, Verita does not promise absolute or "magic" anonymity.
            Instead, our architecture focuses on <strong>preserving anonymous submission and minimizing identity exposure</strong>
            across two distinct dimensions:
          </p>
        </div>

        <!-- Security Operations Photographic Showcase -->
        <div class="group relative rounded-xl border border-border bg-card p-2 shadow-md overflow-hidden card-hover-lift">
          <div class="aspect-[21/9] sm:aspect-[24/9] w-full rounded-lg overflow-hidden bg-muted/40 relative">
            <img
              src="/security-operations.jpg"
              alt="Enterprise Security and Compliance Center"
              class="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex items-end p-4 sm:p-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                <div>
                  <p class="text-xs font-bold text-foreground uppercase tracking-wider">Air-Gapped Ingestion Pipeline</p>
                  <p class="text-[11px] text-muted-foreground">Zero persistent session tokens · Hardware-isolated database encryption</p>
                </div>
                <span class="inline-flex items-center gap-1.5 rounded bg-background/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono font-medium border border-border">
                  <ActivityIcon class="size-3 text-emerald-500" />
                  AES-256 / SHA-256
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Metadata level -->
          <div class="rounded-lg border border-border bg-card p-6 space-y-3 card-hover-lift">
            <div class="flex items-center gap-2">
              <ShieldCheckIcon class="size-5 text-emerald-600" />
              <h3 class="text-sm font-bold text-foreground">1. Metadata-Level Protection (Guaranteed)</h3>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Verita does not log IP addresses, browser user-agents, hardware fingerprints, or timestamps associated with network packets.
              No user account is ever created for the reporter. Case verification is governed entirely by a 16-character UUID
              and a cryptographic one-way hashed PIN.
            </p>
          </div>

          <!-- Content level caveat -->
          <div class="rounded-lg border border-warning/40 bg-warning/5 p-6 space-y-3 card-hover-lift">
            <div class="flex items-center gap-2">
              <OctagonAlertIcon class="size-5 text-warning" />
              <h3 class="text-sm font-bold text-foreground">2. Content-Level Disclosure (Reporter Responsibility)</h3>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Verita protects metadata, but <strong>cannot automatically redact personal identifiers embedded within evidence</strong>
              (such as bank transfer receipts bearing your personal name or account number). Case reporters are strongly advised
              to crop or black out personal identifying details prior to uploading documents.
            </p>
          </div>
        </div>
      </section>

      <!-- Section 3: AI Processing Scope & Strict Ethical Boundaries -->
      <section id="ai-scope" class="space-y-6 pt-6 border-t border-border">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-lg border border-border bg-primary/10 flex items-center justify-center text-primary">
            <CpuIcon class="size-5" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-foreground">AI Processing Scope &amp; Non-Judgment Guarantee</h2>
            <p class="text-xs text-muted-foreground">Gemini AI structures evidence — humans decide outcomes</p>
          </div>
        </div>

        <p class="text-sm text-muted-foreground leading-relaxed">
          Artificial Intelligence in Verita is utilized strictly as an organizational assistant, not an automated tribunal.
          The system enforces strict algorithmic guardrails:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="rounded-lg border border-border bg-card p-5 space-y-3 card-hover-lift">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">What the AI Does</h3>
            <ul class="space-y-2 text-xs text-foreground">
              <li class="flex items-start gap-2">
                <CheckCircle2Icon class="size-4 text-primary shrink-0 mt-0.5" />
                <span>Generates an inferred chronological timeline from narrative statements and screenshots.</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckCircle2Icon class="size-4 text-primary shrink-0 mt-0.5" />
                <span>Checks completeness of fraud fields (date, amount, purpose, person involved).</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckCircle2Icon class="size-4 text-primary shrink-0 mt-0.5" />
                <span>Identifies factual discrepancies between reported statements and uploaded evidence.</span>
              </li>
            </ul>
          </div>

          <div class="rounded-lg border border-border bg-card p-5 space-y-3 card-hover-lift">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-destructive">What the AI Never Does</h3>
            <ul class="space-y-2 text-xs text-muted-foreground">
              <li class="flex items-start gap-2">
                <span class="text-destructive font-bold">✕</span>
                <span>Never calculates credibility scores, guilt probabilities, or risk ratings.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-destructive font-bold">✕</span>
                <span>Never decides whether fraud or misconduct actually occurred.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-destructive font-bold">✕</span>
                <span>Never recommends disciplinary actions, sanctions, or case dismissal.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Section 4: Governance, Separation of Powers, and ISO 37002:2021 -->
      <section id="policy" class="space-y-6 pt-6 border-t border-border">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-lg border border-border bg-primary/10 flex items-center justify-center text-primary">
            <ScaleIcon class="size-5" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-foreground">Investigative Governance &amp; Access Controls</h2>
            <p class="text-xs text-muted-foreground">Access follows responsibility, not organizational rank</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="rounded-lg border border-border bg-card p-5 space-y-2 card-hover-lift">
            <h3 class="text-sm font-bold text-foreground">Department Heads</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Assigned based on the department involved in the incident. Department Heads claim cases, review the evidence,
              communicate directly with reporters in text-only chat, and write final resolution summaries.
            </p>
          </div>

          <div class="rounded-lg border border-border bg-card p-5 space-y-2 card-hover-lift">
            <h3 class="text-sm font-bold text-foreground">Executive Management</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Managers administer platform accounts, monitor aggregate analytics, and reassign conflict cases.
              <strong>Managers cannot inspect case evidence or chat logs by default</strong> unless a reporter explicitly triggers an escalation.
            </p>
          </div>

          <div class="rounded-lg border border-border bg-card p-5 space-y-2 card-hover-lift">
            <h3 class="text-sm font-bold text-foreground">Escalation Protection</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              If an assigned Department Head is unresponsive, conflicted, or improperly dismissive, the reporter
              can trigger an audit-logged escalation that brings the file directly to Executive Management.
            </p>
          </div>
        </div>

        <!-- ISO 37002 Cycle -->
        <div class="rounded-lg border border-border bg-muted/30 p-6 space-y-3 card-hover-lift">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-foreground">
            ISO 37002:2021 Whistleblowing Management Standard Alignment
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
              <p class="text-[11px] text-muted-foreground">AI timeline structuring, triage, conflict-of-interest check.</p>
            </div>
            <div class="border-t-2 border-primary pt-2">
              <span class="text-xs font-bold text-foreground">3. Addressing</span>
              <p class="text-[11px] text-muted-foreground">Department Head review, two-way anonymous chat, further evidence.</p>
            </div>
            <div class="border-t-2 border-primary pt-2">
              <span class="text-xs font-bold text-foreground">4. Concluding</span>
              <p class="text-[11px] text-muted-foreground">Resolution notes, immutable audit logs, disciplinary referral.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Footer Box -->
      <section class="rounded-xl border border-border bg-card p-8 sm:p-10 text-center space-y-4 card-hover-lift shadow-sm">
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Ready to submit a confidential report?
        </h2>
        <p class="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Your disclosure preserves ethical standards and accountability across partner enterprises.
          No email, corporate login, or identity disclosure is required.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4 pt-2">
          <AppButton
            to="/cases/submit"
            size="default"
            variant="default"
            class="shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <ShieldAlertIcon class="size-4 mr-1.5" />
            Report an incident
          </AppButton>
          <AppButton
            to="/cases/verify-pin"
            size="default"
            variant="outline"
            class="transition-all duration-300 hover:-translate-y-0.5"
          >
            Track an existing case
            <ArrowRightIcon class="size-4 ml-1.5" />
          </AppButton>
        </div>
      </section>
    </div>
  </div>
</template>
