---
name: verita-ecosystem
description: Comprehensive architectural cheatsheet and operational guide for developing, extending, and auditing the Verita whistleblower & case management system (Vue 3 frontend and Laravel backend).
---

# Verita Ecosystem Developer Skill

Use this skill whenever working on, extending, debugging, or auditing the **Verita** application stack.

## 1. System Overview

Verita is a full-stack, enterprise-grade anonymous workplace-misconduct reporting and investigation system built to comply with **ISO 37002:2021** and **EU Directive 2019/1937**.

- **Frontend (`verita-vue`)**: Vue 3.5, TypeScript 5.7, Vite 6, Tailwind CSS v4 (CSS-native config), shadcn-vue / Reka UI primitives, Pinia 3.
- **Backend (`verita-api`)**: Laravel 11/13, PostgreSQL, Redis (Predis), Laravel Reverb (WebSockets), Tymon JWT-Auth, Google Gemini 2.5 Flash.
- **Lead Developer**: [Carmine Akanabe](https://github.com/CarmineAkanabe)

---

## 2. Ports & Local Services

| Service               | Port / URL              | Command                                | Notes                                           |
| --------------------- | ----------------------- | -------------------------------------- | ----------------------------------------------- |
| **Vue 3 Frontend**    | `http://localhost:5173` | `npm run dev`                          | Running Vite dev server                         |
| **Laravel API**       | `http://localhost:8000` | `php artisan serve --port=8000`        | Base URL: `http://localhost:8000/api/v1`        |
| **Reverb WebSockets** | `localhost:8080`        | `php artisan reverb:start --port=8080` | Pusher protocol over WS                         |
| **Queue Worker**      | Background daemon       | `php artisan queue:work`               | Processes Gemini AI jobs and mail notifications |

---

## 3. Authentication & Role Boundaries

### A. Anonymous Case Reporter

- **No registration**: No email, no password, no persistent user record.
- **Credential Pair**: System generates UUID `caseId` + 6-character cryptographic tracking PIN on submission (`POST /api/v1/cases`).
- **Exchange**: Reporter verifies PIN via `POST /api/v1/cases/{caseId}/verify-pin` to obtain a short-lived JWT token.
- **Scope**: Guarded by `auth:case-api`. Used exclusively with `/cases/me/*` routes.
- **Asymmetric Identity**: In chat and logs, the reporter is always masked as `Case<ID>Reporter`. Investigators cannot see reporter device info, typing status, or presence.

### B. Staff Accounts

- Authenticated via `POST /api/v1/auth/login` returning staff JWT (`auth:api`).
- **Roles**:
  - `DEPARTMENT_HEAD`: Departmental intake queue (`/app/cases`), case claiming, evidence inspection, status updates with mandatory notes, two-way chat with reporter, case audit history.
  - `MANAGER`: Full organization-wide case oversight, department CRUD (`/app/departments`), personnel provisioning (`/app/department-heads`), case assignment modal, executive engagement reports (`/app/reports/user-engagement`).

### Testing Credentials:

- **Manager**: `manager@verita.com` / `password`
- **Department Head**: `depthead@verita.com.com` / `password`

---

## 4. Visual Design Tokens & Styling Rules

Verita uses a **warm creamy corporate theme** (light mode only; no dark mode toggle):

- **Canvas Background**: Soft warm off-white (`#F7F8FA`).
- **Cards (`.card-creamy`)**: Warm ivory `#F8F3EA` with border `#E2D5C3`.
- **Primary Brand**: Report orange `#A2561B` (WCAG AA compliant).
- **Secondary / Header / Badges**: Deep executive navy `#22293A`.
- **Vocabulary**: Always use plain, human language. Strictly avoid "Dossier", "Jurisprudence", and bureaucratic jargon.
- **WCAG AA Compliance**:
  - Color is **never** the sole conveyer of status: all lifecycle badges pair an icon with text in `StatusPill.vue`.
  - Keyboard navigation: universal `:focus-visible` outline rings with 2px offset.

---

## 5. Real-Time WebSocket Architecture

- **Engine**: Laravel Reverb running on port `8080`.
- **Channels**: Private channel `case.{caseId}` authorized at `POST /broadcasting/auth`.
- **Events**:
  - `MessageSent`: Broadcasts incoming messages between reporter and assigned Department Head.
  - Presence status: Department Head presence (`ONLINE` / `OFFLINE`) is broadcast to reporters and managers.
- **Resilience**:
  - `NetworkStatusBanner.vue` mounted in `App.vue` listens to `navigator.onLine` and Reverb `state_change`.
  - Displays instant amber banner during drops with one-click **Reconnect** and green toast on restoration.

---

## 6. Audit Log System

Every state-altering event writes an immutable entry via `AuditLogService`:

- **Endpoints**:
  - `GET /api/v1/cases/{caseId}/audit-logs`: Chronological case history and timeline.
  - `GET /api/v1/audit-logs`: Scoped organization-wide or departmental audit ledger.
- **Logged Events**:
  - `STATUS_CHANGED`: Previous status, new status, and the investigator's mandatory note.
  - `AI_PROCESSED`: Gemini structuring completion.
  - `EVIDENCE_ADDED` / `EVIDENCE_REVIEWED`: File interactions.
  - `MESSAGE_SENT`: Consultation communication.
  - `ESCALATED`: Whistleblower escalation.

---

## 7. Useful Code Pointers

- **Router**: `src/router/index.ts` & `src/router/guards.ts` (`requireStaffAuth`, `requireRole`, `requireCaseAuth`).
- **Realtime Client**: `src/shared/realtime/socket-client.ts` & `src/shared/realtime/useNetworkStatus.ts`.
- **API Client**: `src/shared/api/client.ts` & `src/shared/api/interceptor.ts`.
- **Audit Feature**: `src/features/cases/audit.ts`.
- **Case Views**: `src/pages/cases/CaseDetail.vue` & `src/pages/staff/cases/CasesIndex.vue`.
- **Manager Views**: `src/pages/staff/manager/ManageDepartments.vue`, `ManageAccounts.vue`, `EngagementReports.vue`.
