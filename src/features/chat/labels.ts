// features/chat/labels.ts

/**
 * Asymmetric identity rule: investigators only ever see the Case Reporter as
 * `Case<ID>Reporter`, derived from the case ID. No name, email, or profile data.
 */
export function getReporterLabel(caseId: string): string {
  const shortId = caseId.replace(/-/g, '').slice(0, 6).toUpperCase()
  return `Case${shortId}Reporter`
}
