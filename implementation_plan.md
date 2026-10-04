# Component Breakdown Plan

This plan outlines the strategy to break down the massive `CaseDetail.vue` (~1448 lines) and `CaseDashboard.vue` (~900 lines) components into smaller, more manageable pieces in alignment with the architecture guidelines.

## 1. CaseDetail.vue Refactoring

**Current State**: 1448 lines containing evidence list, audit timeline, status headers, manager assignment modals, and complex loading screens.

**Target Components to Extract** (`src/components/complex/cases/`):
- `CaseDetailHeader.vue`: Extracts the top section (Case ID, Status Pill, Assignment status, Claim/Assign buttons).
- `CaseEvidenceList.vue`: Extracts the `v-for` evidence loops and handles the file download/preview logic via props and emits.
- `CaseAuditTimeline.vue`: Extracts the `v-for` on `auditLogs` and the visual timeline rendering.
- `CaseLoadingScreen.vue`: Extracts the `loadingProgress` interval and the `departmentHeadLoadingStages`.
- `CaseAIAnalysis.vue`: Extracts the AI Forensic Analysis box (credibility score, timeline discrepancies).

**Changes to `CaseDetail.vue`**:
- Will become a thin wrapper that orchestrates state from `useAuthStore` and the API, passing data as props to the above components.

## 2. CaseDashboard.vue Refactoring

**Current State**: ~900 lines containing the reporter's view of the case status, timeline, secure messaging banner, and detailed view.

**Target Components to Extract** (`src/components/complex/cases/`):
- `CaseDashboardHeader.vue`: Extracts the top section (Anonymous ID badge, Print/Copy buttons).
- `CaseDashboardStatus.vue`: Extracts the visual stepper for the current case status.
- `CaseDashboardEvidence.vue`: Extracts the reporter's view of their uploaded evidence.

**Changes to `CaseDashboard.vue`**:
- Focus strictly on fetching `reporterCase.value` and layout structure.

## Next Steps
This refactoring should be done sequentially, one component at a time, to ensure we don't break reactivity or introduce prop-drilling bugs.
