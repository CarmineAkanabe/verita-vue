---
name: verita-skill-builder
description: Guide and toolkit for creating, testing, and registering new Antigravity skills, rules, and workflows for the Verita anonymous reporting and case management ecosystem.
---

# Verita Skill Builder

Use this skill whenever the user asks to **build a new skill**, create an agent workflow, or package specialized capabilities for the **Verita** project.

---

## 1. Skill Creation Philosophy

In the Antigravity architecture, **skills** are on-demand capabilities packaged inside the repository's `.agents/skills/<skill-name>/` directory. Skills use **progressive disclosure**: only their `name` and `description` are loaded into the agent's initial prompt. The full instructions inside `SKILL.md` are loaded dynamically when relevant to a task.

When building a skill for Verita:
1. **Focus on Workflows**: Teach the agent specific multi-step procedures (e.g. adding a new case report export, tuning AI triage prompts, configuring mailers, or auditing security).
2. **Adhere to Core Constraints**: Every skill must respect:
   - Light theme only (no dark mode).
   - `.card-creamy` card styling (`#F8F3EA` background, `#E2D5C3` border).
   - Plain language (never use "Dossier").
   - Anonymous zero-PII security rules.
   - Author credit: [Carmine Akanabe](https://github.com/CarmineAkanabe).

---

## 2. Skill Directory Structure

```
.agents/
├── rules/
│   └── verita-architecture.md         # Persistent rules applied across all tasks
└── skills/
    ├── verita-ecosystem/              # Master ecosystem cheatsheet
    │   └── SKILL.md
    └── <new-skill-name>/              # Your new specialized skill
        ├── SKILL.md                   # REQUIRED: Frontmatter + Instructions
        ├── scripts/                   # OPTIONAL: Helper scripts or utilities
        └── references/                # OPTIONAL: Additional documentation or schemas
```

---

## 3. Skill File Template (`SKILL.md`)

When creating a new skill file, use this exact format:

```markdown
---
name: <kebab-case-name>
description: >-
  Concise 1-3 sentence summary explaining what this skill does and when an
  agent or user should trigger it. Include relevant keywords and triggers.
---

# <Skill Title>

[A brief introduction explaining the scope, prerequisites, and intent of the skill.]

## 1. When to Use This Skill
- [Trigger condition 1]
- [Trigger condition 2]

## 2. Architectural Context & Dependencies
- **Relevant Files**: [Link to files e.g. `src/features/cases/audit.ts`]
- **API Endpoints**: [List corresponding endpoints]
- **Services Required**: [e.g. Laravel Reverb on port 8080, Vite on 5173]

## 3. Step-by-Step Execution Workflow
1. **Step 1: Inspect / Setup**: ...
2. **Step 2: Implementation**: ...
3. **Step 3: Verification**: ...

## 4. Quality Checklist
- [ ] Uses `.card-creamy` styling for UI components
- [ ] No mention of "Dossier"; plain language used throughout
- [ ] WCAG AA compliance (status pills have icons + text)
- [ ] Type-check verified with `npm run build`
```

---

## 4. Catalog of Pre-Packaged Skill Blueprints

Here are standard skill blueprints you can instantiate for the user upon request:

### Blueprint A: `verita-audit-exporter`
- **Purpose**: Generates forensic PDF, CSV, or JSON audit trail exports for legal discovery.
- **Key Modules**: `src/features/cases/audit.ts`, `app/Http/Controllers/V1/CaseManagementController.php@auditLogs`.
- **Primary Rules**: Must preserve the immutable cryptographic chain of custody; masked reporter identity (`Case<ID>Reporter`).

### Blueprint B: `verita-gemini-tuner`
- **Purpose**: Calibrates Google Gemini 2.5 Flash prompt parameters, structured JSON schemas, and risk assessment thresholds.
- **Key Modules**: `app/Services/GeminiService.php`, `app/Jobs/ProcessCaseWithGemini.php`.
- **Primary Rules**: Never include reporter IP or location data in prompts sent to the LLM. Keep severity scores bounded between `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`.

### Blueprint C: `verita-mailer-customizer`
- **Purpose**: Extends responsive email templates for status notifications, assignment alerts, and escalations.
- **Key Modules**: `app/Mail/CaseStatusUpdatedMail.php`, `resources/views/emails/case-status-updated.blade.php`.
- **Primary Rules**: Must use clean tables and inline CSS with `#A2561B` brand accents to avoid email spam filters.

### Blueprint D: `verita-realtime-monitor`
- **Purpose**: Audits and instruments WebSocket channels, presence events, and broadcast reconnect strategies.
- **Key Modules**: `src/shared/realtime/socket-client.ts`, `src/shared/realtime/useNetworkStatus.ts`, `app/Events/MessageSent.php`.
- **Primary Rules**: Reverb listens on `localhost:8080`. Always broadcast via `private-case.{caseId}` with authorization.

---

## 5. Verification Commands for Any New Skill

After scaffolding code or changes under a skill, run these verification steps:

```bash
# 1. Verify TypeScript and Vite bundle integrity in verita-vue
npm.cmd run build

# 2. Check PHP route and syntax health in verita-api (using C:\php\php.exe)
C:\php\php.exe artisan route:list --path=api/v1
```
