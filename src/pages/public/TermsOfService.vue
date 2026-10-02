<!-- pages/public/TermsOfService.vue -->
<script setup lang="ts">
import {
  ShieldCheckIcon,
  LockIcon,
  ScaleIcon,
  BotIcon,
  FileTextIcon,
  AlertCircleIcon,
  EyeOffIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  Building2Icon,
} from '@lucide/vue'

const lastUpdated = 'October 2026'

const sections = [
  { id: 'purpose', title: '1. System Purpose & Legal Scope' },
  { id: 'anonymity', title: '2. Case Reporter Anonymity & Zero-PII Protections' },
  { id: 'non-retaliation', title: '3. Strict Non-Retaliation Commitment' },
  { id: 'roles', title: '4. Staff Roles (Managers & Department Heads)' },
  { id: 'ai-boundaries', title: '5. AI Processing Scope & Non-Adjudication' },
  { id: 'evidence', title: '6. Evidence Integrity & Chain of Custody' },
  { id: 'audit', title: '7. Immutable Compliance Audit Ledger' },
  { id: 'conduct', title: '8. User Conduct & Good Faith Submissions' },
]

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="py-10 sm:py-14 bg-background min-h-screen">
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
      <!-- Page Header -->
      <div class="text-center space-y-4 max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <ScaleIcon class="size-3.5" />
          <span>ISO 37002:2021 &amp; EU Directive 2019/1937 Aligned</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-serif">
          Terms of Service &amp; Governance Charter
        </h1>
        <p class="text-sm sm:text-base text-muted-foreground leading-relaxed">
          The legal framework, confidentiality safeguards, and operational rules governing report submission,
          investigation management, and objective review in the Verita system.
        </p>
        <p class="text-xs text-muted-foreground/80 font-mono">
          Last revised: {{ lastUpdated }} · Version 2.4
        </p>
      </div>

      <!-- Quick Nav Pills -->
      <div class="p-4 rounded-xl bg-card border border-border card-creamy shadow-xs">
        <span class="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
          Quick Navigation
        </span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="sec in sections"
            :key="sec.id"
            type="button"
            class="text-xs px-2.5 py-1 rounded-lg bg-background border border-border hover:border-primary text-foreground hover:text-primary transition-all cursor-pointer"
            @click="scrollToSection(sec.id)"
          >
            {{ sec.title }}
          </button>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="space-y-8">
        <!-- Section 1: Purpose & Scope -->
        <section id="purpose" class="p-6 sm:p-8 rounded-2xl bg-card border border-border card-creamy shadow-xs space-y-4">
          <div class="flex items-center gap-3 border-b border-border/80 pb-3">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <Building2Icon class="size-5" />
            </div>
            <h2 class="text-xl font-bold text-foreground">1. System Purpose &amp; Legal Scope</h2>
          </div>
          <div class="space-y-3 text-xs sm:text-sm text-foreground/85 leading-relaxed">
            <p>
              Verita is an enterprise-wide Case Management and Consulting System created to facilitate the lawful,
              secure, and confidential reporting of workplace misconduct, financial irregularities, harassment, safety violations,
              and compliance breaches in commercial and public enterprises.
            </p>
            <p>
              The platform operates in strict conformance with the <strong>ISO 37002:2021 Case Reporting Management Systems Guidelines</strong>
              and adheres to the protections specified by <strong>EU Directive 2019/1937</strong>. By submitting a report or accessing the system
              as an authorized staff member, you agree to abide by these terms.
            </p>
          </div>
        </section>

        <!-- Section 2: Case Reporter Anonymity & Zero-PII -->
        <section id="anonymity" class="p-6 sm:p-8 rounded-2xl bg-card border border-border card-creamy shadow-xs space-y-4">
          <div class="flex items-center gap-3 border-b border-border/80 pb-3">
            <div class="p-2 rounded-lg bg-emerald-600/10 text-emerald-700">
              <EyeOffIcon class="size-5" />
            </div>
            <h2 class="text-xl font-bold text-foreground">2. Case Reporter Anonymity &amp; Zero-PII Protections</h2>
          </div>
          <div class="space-y-3 text-xs sm:text-sm text-foreground/85 leading-relaxed">
            <p>
              Verita enforces a strict <strong>Zero-Personally Identifiable Information (Zero-PII)</strong> architectural safeguard for anonymous case reporters:
            </p>
            <ul class="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>No Mandatory Account Creation:</strong> Anonymous case reporters are never asked to register with names, personal email addresses, phone numbers, or social identities.
              </li>
              <li>
                <strong>No Technical Fingerprinting:</strong> The system does not persist, record, log, or broadcast IP addresses, MAC addresses, browser headers, or device fingerprints.
              </li>
              <li>
                <strong>Cryptographic Access:</strong> Case tracking and ongoing consultation are accessible exclusively via a unique, random UUID (<code class="font-mono text-primary font-bold">Case ID</code>) and a 6-character cryptographically hashed <code class="font-mono text-primary font-bold">Tracking PIN</code>. If these keys are lost by the reporter, they cannot be reconstructed.
              </li>
              <li>
                <strong>Asymmetric Channel Identity:</strong> In all two-way communication channels, the case reporter is represented strictly as <code class="font-mono font-bold">Case&lt;ID&gt;Reporter</code>. Investigator presence or typing telemetry is never leaked to the reporter view.
              </li>
            </ul>
          </div>
        </section>

        <!-- Section 3: Non-Retaliation Commitment -->
        <section id="non-retaliation" class="p-6 sm:p-8 rounded-2xl bg-card border border-border card-creamy shadow-xs space-y-4">
          <div class="flex items-center gap-3 border-b border-border/80 pb-3">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheckIcon class="size-5" />
            </div>
            <h2 class="text-xl font-bold text-foreground">3. Strict Non-Retaliation Commitment</h2>
          </div>
          <div class="space-y-3 text-xs sm:text-sm text-foreground/85 leading-relaxed">
            <p>
              Participating organizations using Verita guarantee unconditional non-retaliation protections:
            </p>
            <p>
              Any attempt by company officers, managers, or personnel to identify, penalize, discipline, demote, terminate,
              or subject an individual to hostile treatment for submitting a good-faith case report constitutes a severe violation
              of organizational policy and applicable law.
            </p>
            <div class="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary leading-relaxed flex items-start gap-2.5">
              <AlertCircleIcon class="size-4 shrink-0 mt-0.5" />
              <span>
                If a case concerns or implicates an assigned Department Head, the Case Submission workflow provides an immediate
                <strong>Bypass Toggle</strong>, which routes the case directly to Executive Managers without notifying the department head.
              </span>
            </div>
          </div>
        </section>

        <!-- Section 4: Staff Roles & Governance -->
        <section id="roles" class="p-6 sm:p-8 rounded-2xl bg-card border border-border card-creamy shadow-xs space-y-4">
          <div class="flex items-center gap-3 border-b border-border/80 pb-3">
            <div class="p-2 rounded-lg bg-[#22293A]/10 text-[#22293A]">
              <LockIcon class="size-5" />
            </div>
            <h2 class="text-xl font-bold text-foreground">4. Staff Roles (Managers &amp; Department Heads)</h2>
          </div>
          <div class="space-y-4 text-xs sm:text-sm text-foreground/85 leading-relaxed">
            <p>
              To maintain the integrity of investigation workflows, Verita recognizes two distinct staff roles with strict separation of duties:
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-background border border-border space-y-2">
                <span class="text-xs font-bold text-primary uppercase tracking-wider">Manager</span>
                <p class="text-xs text-muted-foreground leading-relaxed">
                  Responsible for creating departments, provisioning Department Head accounts, assigning unassigned cases,
                  and viewing organizational engagement metrics. Managers are restricted from viewing raw case chat consultations
                  to preserve reporter confidentiality.
                </p>
              </div>
              <div class="p-4 rounded-xl bg-background border border-border space-y-2">
                <span class="text-xs font-bold text-[#22293A] uppercase tracking-wider">Department Head</span>
                <p class="text-xs text-muted-foreground leading-relaxed">
                  Authorized investigation officer who claims departmental cases, reviews forensic evidence, conducts confidential
                  two-way consultation with the Case Reporter, updates case progression, and submits formal resolutions.
                </p>
              </div>
            </div>
            <p>
              All staff members are subject to strict non-disclosure obligations. Unauthorized disclosure of case details or
              reporter communications will result in immediate revocation of credentials and disciplinary or legal action.
            </p>
          </div>
        </section>

        <!-- Section 5: AI Processing Boundaries -->
        <section id="ai-boundaries" class="p-6 sm:p-8 rounded-2xl bg-card border border-border card-creamy shadow-xs space-y-4">
          <div class="flex items-center gap-3 border-b border-border/80 pb-3">
            <div class="p-2 rounded-lg bg-purple-100 text-purple-800">
              <BotIcon class="size-5" />
            </div>
            <h2 class="text-xl font-bold text-foreground">5. AI Processing Scope &amp; Non-Adjudication Guarantee</h2>
          </div>
          <div class="space-y-3 text-xs sm:text-sm text-foreground/85 leading-relaxed">
            <p>
              Verita incorporates artificial intelligence (Google Gemini) strictly as an <strong>analytical assistant</strong>.
              The AI engine is bounded by the following immutable rules:
            </p>
            <ul class="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>No Automated Adjudication:</strong> The AI model never makes disciplinary determinations, case approvals, or punitive decisions. All findings are subject to human review by authorized Department Heads.
              </li>
              <li>
                <strong>Forensic Support Only:</strong> AI tasks are limited to OCR document transcription, currency and date normalization, chronological timeline assembly, and identification of factual contradictions in evidence.
              </li>
              <li>
                <strong>No Model Training on Case Data:</strong> Case text and submitted evidence are processed ephemerally and are never used to train public machine learning models.
              </li>
            </ul>
          </div>
        </section>

        <!-- Section 6: Evidence Integrity -->
        <section id="evidence" class="p-6 sm:p-8 rounded-2xl bg-card border border-border card-creamy shadow-xs space-y-4">
          <div class="flex items-center gap-3 border-b border-border/80 pb-3">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <FileTextIcon class="size-5" />
            </div>
            <h2 class="text-xl font-bold text-foreground">6. Evidence Integrity &amp; Chain of Custody</h2>
          </div>
          <div class="space-y-3 text-xs sm:text-sm text-foreground/85 leading-relaxed">
            <p>
              Evidence files uploaded during case intake (PDF, JPG, PNG up to 10MB each) are automatically stripped of
              identifying EXIF metadata, camera serial numbers, and geographic location stamps prior to storage.
            </p>
            <p>
              Files are stored in encrypted object vaults. Any inspection, download, or review of evidence by Department Heads
              generates a verifiable cryptographic chain-of-custody entry in the audit ledger.
            </p>
          </div>
        </section>

        <!-- Section 7: Audit Ledger -->
        <section id="audit" class="p-6 sm:p-8 rounded-2xl bg-card border border-border card-creamy shadow-xs space-y-4">
          <div class="flex items-center gap-3 border-b border-border/80 pb-3">
            <div class="p-2 rounded-lg bg-emerald-600/10 text-emerald-700">
              <CheckCircle2Icon class="size-5" />
            </div>
            <h2 class="text-xl font-bold text-foreground">7. Immutable Compliance Audit Ledger</h2>
          </div>
          <div class="space-y-3 text-xs sm:text-sm text-foreground/85 leading-relaxed">
            <p>
              Every state change in the Verita lifecycle—including case submission, assignment, status transition,
              consultation message transmission, notes, and resolution summaries—is permanently logged through the
              <code class="font-mono text-primary font-bold">AuditLogService</code>.
            </p>
            <p>
              Audit records are tamper-evident and provide non-repudiation guarantees for regulatory scrutiny under ISO 37002 compliance audits.
            </p>
          </div>
        </section>

        <!-- Section 8: User Conduct -->
        <section id="conduct" class="p-6 sm:p-8 rounded-2xl bg-card border border-border card-creamy shadow-xs space-y-4">
          <div class="flex items-center gap-3 border-b border-border/80 pb-3">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <AlertCircleIcon class="size-5" />
            </div>
            <h2 class="text-xl font-bold text-foreground">8. User Conduct &amp; Good Faith Submissions</h2>
          </div>
          <div class="space-y-3 text-xs sm:text-sm text-foreground/85 leading-relaxed">
            <p>
              Case reporters are expected to provide truthful, factual accounts to the best of their personal recollection and belief.
              While reports do not require definitive legal proof to be reviewed, knowingly fabricating evidence or lodging defamatory
              claims with malicious intent is strictly prohibited.
            </p>
            <p>
              Users must not attempt to execute Denial of Service (DoS) attacks, automated scraping, vulnerability exploitation,
              or reverse-engineering of encryption keys on the Verita infrastructure.
            </p>
          </div>
        </section>
      </div>

      <!-- Action Card -->
      <div class="p-8 rounded-2xl bg-gradient-to-br from-[#22293A] to-[#161B26] text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <h3 class="text-lg sm:text-xl font-bold tracking-tight">Ready to Submit a Report?</h3>
          <p class="text-xs sm:text-sm text-white/80 leading-relaxed">
            Your report is strictly confidential, encrypted, and backed by zero-retaliation protections.
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0 flex-wrap">
          <router-link
            to="/cases/submit"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#A2561B] text-white hover:bg-[#854310] transition-colors shadow-xs"
          >
            <span>Submit a Report</span>
            <ArrowRightIcon class="size-3.5" />
          </router-link>
          <router-link
            to="/cases/verify-pin"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
          >
            <span>Track Existing Case</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
