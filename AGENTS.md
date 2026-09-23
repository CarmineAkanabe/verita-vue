# Verita Project - Agent Architecture & Working Rules

Welcome to the **Verita** project workspace. This document serves as the primary system directive for all AI pair programmers, autonomous agents, and contributors working in this repository.

---

## 1. Project Identity & Authorship

- **Project**: Verita Whistleblowing & Case Management System
- **Standards Compliance**: ISO 37002:2021 Whistleblowing Management Systems, EU Directive 2019/1937
- **Lead Architect & Engineer**: [Carmine Akanabe](https://github.com/CarmineAkanabe)
- **Repository Structure**:
  - `verita-vue`: Modern Vue 3.5 frontend (TypeScript, Vite, Tailwind CSS v4, Pinia, Reka UI)
  - `verita-api`: Laravel 11/13 REST API (PHP 8.2+, PostgreSQL, Redis, Laravel Reverb, Tymon JWT, Google Gemini 2.5 Flash)

---

## 2. Mandatory Behavioral & Design Rules

Whenever you modify, extend, or review code in this project, you **MUST** adhere to the following rules:

### A. Design Aesthetics & Visual Tokens
1. **Light Theme Only**: Do **not** introduce a dark mode toggle or dark theme overrides.
2. **Creamy Cards**: Cards use `.card-creamy` styling:
   - Background: `#F8F3EA` (`hsl(38, 50%, 96%)`)
   - Border: `#E2D5C3` (`hsl(36, 35%, 83%)`)
3. **Canvas Background**: Soft warm off-white `#F7F8FA`.
4. **Primary Brand Color**: Report Orange `#A2561B` (WCAG AA compliant).
5. **Structural Accents**: Deep Executive Navy `#22293A`.
6. **Card Darkness**: On dashboards, cards should feel substantial and creamy, not stark white.

### B. Plain Human Language (Strict Vocabulary Rule)
- Always use clear, plain, and accessible words.
- **NEVER use the word "Dossier"** (this is a *case* management system, use "Case").
- Avoid dense legalistic jargon such as "Jurisprudence", "Intake Prolegomenon", etc.

### C. Accessibility (WCAG AA)
- Never convey state or status using color alone: all status pills must pair a distinct Lucide icon with human-readable text (see `src/components/ui/status-pill/StatusPill.vue`).
- Universal focus states: all interactive elements must support clear, high-contrast `:focus-visible` outline rings with a 2px offset.
- All form controls must be accessible and accompanied by semantic labels.

### D. Privacy & Whistleblower Protection
- **Zero-PII Anonymous Intake**: Anonymous reporters are never registered with email, password, or profile data. They access their case strictly via a generated UUID `caseId` and 6-character cryptographically hashed tracking PIN (`POST /api/v1/cases/{caseId}/verify-pin`).
- **No Fingerprinting**: Never persist, log, or broadcast IP addresses, user-agent strings, or browser fingerprints.
- **Asymmetric Identity**: In two-way communication channels, the whistleblower is strictly displayed as `Case<ID>Reporter`. Investigator presence/typing indicators must never leak to the whistleblower view.

### E. Audit Ledger Integrity
- Every state change (status update, note, claiming, AI analysis, evidence interaction) must write an immutable audit log entry through `AuditLogService`.

---

## 3. Local Development Ports & Services

| Service               | Address                 | Command                                | Notes                                    |
| --------------------- | ----------------------- | -------------------------------------- | ---------------------------------------- |
| **Vue 3 Frontend**    | `http://localhost:5173` | `npm run dev`                          | Running Vite dev server                  |
| **Laravel API**       | `http://localhost:8000` | `php artisan serve --port=8000`        | Base API: `http://localhost:8000/api/v1` |
| **Reverb WebSockets** | `localhost:8080`        | `php artisan reverb:start --port=8080` | Pusher protocol over WS                  |
| **Queue Worker**      | Background daemon       | `php artisan queue:work`               | Background AI & mail jobs                |

### Testing Accounts:
- **Manager**: `manager@verita.com` / `password`
- **Department Head**: `depthead@verita.com` / `password`

---

## 4. Building New Skills & Extending the Ecosystem

When the user asks you to build a new skill or feature for Verita:
1. Check existing skills in `.agents/skills/` (e.g. `verita-ecosystem`, `verita-skill-builder`).
2. Follow the skill blueprint in `.agents/skills/verita-skill-builder/SKILL.md`.
3. Preserve all core styling (`.card-creamy`), terminology rules (no "Dossier"), and lead author credits.
