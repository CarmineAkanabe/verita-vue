# Verita Project Architecture Rules & Style Guide

These rules must be observed in all future development sessions on the Verita repositories.

## 1. Design & UI Aesthetics
- **Theme**: Light theme only (do not introduce a dark mode toggle).
- **Cards**: Use the `.card-creamy` styling (`background-color: #F8F3EA !important; border-color: #E2D5C3 !important`).
- **Canvas**: Soft warm off-white (`#F7F8FA`).
- **Primary Color**: Warm amber/orange `#A2561B` for action buttons and active indicators.
- **Header & Navy Accents**: `#22293A` for headers, sidebars, and high-contrast badges.
- **Terminology**: Use clear, plain language. Never use "Dossier", "Jurisprudence", or dense legalistic vocabulary.

## 2. Accessibility (WCAG AA)
- **Status Badges**: Never rely on color alone. Always pair an icon with a human-readable label (`StatusPill.vue`).
- **Focus Rings**: Ensure all interactive buttons, links, and inputs receive visible `:focus-visible` focus rings.
- **Contrast**: Avoid low-contrast text on creamy backgrounds. Ensure text has >= 4.5:1 contrast.

## 3. Privacy & Security
- **Air-Gapped Anonymity**: Anonymous case intake must never collect or persist user identity, IP address, or tracking metadata.
- **PIN Verification**: The 6-character PIN is one-time use and hashed on the server with bcrypt.
- **Asymmetric Chat**: The whistleblower remains masked as `Case<ID>Reporter`. The investigating officer's presence or typing status is never exposed to the whistleblower.
- **Audit Logging**: Every status transition, claim, or forensic note must write an immutable entry to `AuditLogService`.
