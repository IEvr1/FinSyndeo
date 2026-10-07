# FinSyndeo — Security and accessibility launch checklist

6 October 2026 · Requirements for the delivered build. The browser-local prototype has not passed production security or accessibility certification.

## Security acceptance scope

Use a recognised application-security verification baseline appropriate to the risk and architecture, with explicit requirement IDs and test evidence. [OWASP ASVS](https://owasp.org/projects/asvs) supplies a verification framework; choosing it is not a certification.

- Real authenticated sessions, verified account recovery, privileged-role MFA, session expiry/revocation and invitation-only introducer/Admin access. Referral tokens identify attribution, never authentication.
- Server authorization by role, purpose and record owner for every case, policy, person, report, invoice, upload, download and export. Negative tests with a second applicant/provider/introducer must prove isolation.
- Never send full internal stores to external users. Confidential provider identity/terms, screening evidence, payout details and third-party data have separate recipient-specific views.
- Typed server schemas enforce route applicability, canonical countries/currencies, decimal precision, permitted updates, dates and state transitions. Client validation is convenience, not a security boundary.
- Use HTTPS, secure session cookies, CSRF protections where applicable, restrictive content policy, output encoding and controls against injection, abusive requests and account enumeration. Secrets and service keys remain server-side.
- Upload quarantine, file type/size checks, malware scanning and controlled extraction. Store originals separately from externally approved derivatives. No unsafe active document content or arbitrary public links to internal files.
- Website/registry fetching blocks private/internal network targets and unsafe redirects, has resource limits, and treats fetched text as evidence, not instructions. Uploaded text cannot change recipients, eligibility or commercial terms through prompt injection.
- Verified signed payment events, replay prevention, independent bank settlement reconciliation, locked invoice allocations and transactionally posted ledger events. Payment evidence uploads do not initiate or confirm cash by themselves.
- Appropriate maker/checker approval for payout destination changes, payment release and exceptional commercial/tax treatments; separate duties where staffing permits. No Admin self-signing for an introducer.
- Bounded audit retention, protected logs, backup/restore tests, erasure propagation and monitoring of feed/job/outbox failures. Logs must not leak raw sensitive content or become indefinite copies of deleted profiles.
- Tested incident response, vendor contracts, international-transfer arrangements, dependency updates and restore recovery. A live security assessment is performed against the actual deployment and revised after material changes.

## Desktop/mobile accessibility target

Adopt WCAG 2.2 AA as the engineering target and verify the actual screens with manual and automated evidence. This recommendation is not a determination of the exact statutory standard for SOPHIMA. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/).

- Keyboard-complete applicant/provider/introducer/Admin journeys; no focus traps; visible focus and correctly announced dialogs.
- Accessible names, labels, required/error states and live status announcements. Country picker works with keyboard and screen reader; selected values remain understandable when collapsed.
- Semantic headings and reading order. Required fields precede the single navigation row. Summary edits return to the correct field without losing values.
- Contrast and noncolour-only meaning; zoom/reflow tests; readable minimum text and sufficiently sized/spaced mobile actions.
- No compulsory speech, motion or calendar path. Voice has editable text fallback, permission-denied fallback, stop/cancel and clear AI disclosure.
- Accessible authentication/recovery and payment confirmation; no reliance on memory puzzles or inaccessible CAPTCHA-only paths.
- Physical iPhone and Android tests for keyboard covering fields, country overlays, scrolling, touch, orientation, audio interruption and reconnect/resume.
- English plus each genuinely supported translation and any RTL layout tested. Do not hide language controls on mobile or advertise disabled translations as delivered.
- Videos have useful captions/transcript and controls; narration quality does not prove the live voice interface works.

The European Accessibility Act covers specified services, including e-commerce and consumer banking, with scope/exemption rules. Assess FinSyndeo's actual service, enterprise and local implementation before determining its legal obligations; do not assume either automatic exemption or automatic classification as a bank. [Commission EAA overview](https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/european-accessibility-act-eaa_en).

## Release evidence register

For each requirement, record Owner, Applicable/not applicable with reason, Build/version, Test, Evidence, Result, Remediation and Review date. Prototype checks are useful inputs; they do not replace delivered-build testing, physical-device review, vendor integration checks or legal sign-off.
