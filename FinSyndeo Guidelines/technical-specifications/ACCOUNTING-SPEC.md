# FinSyndeo — Introducer, accounting and introduction-fee implementation specification

Revision: 7 October 2026. English handoff for SOPHIMA and Renos. This section describes the corrected local review prototype and the production requirements that remain. No real authentication, contract execution, bank verification, payment, email or production deployment is connected.

## 1. Approved commercial decisions

**C01 — entitlement timestamp:** retain the existing rule: resolve the introducer’s commercial rate at **final approved ledger posting**. Cash value date, provider activity period, document signature date, event time and final posting time are different fields. A delayed tax review posts at the terms effective when the approved entry is created. Original entries are never recomputed after a later tier or bespoke-rate change. Production must use trusted server time and retain the reason for delayed/manual posting.

**C02 — combined services and quota:** a confirmed client case introduced to the **same institution** for bank and merchant services is one introduction, one applicable introduction charge, and one reserved/consumed quota unit. Record both product components. Introduction to two different institutions is two introductions. Use a verified canonical client ID for the quota wallet and a canonical institution legal-entity ID, never a display name or contact email. A second application for the same confirmed case and institution cannot reserve or charge again. Separate confirmed cases must have explicit case identifiers; they must not be silently merged merely because their client is the same.

**C03 — financing success:** an active facility, signed offer, pre-approval or undrawn commitment alone is not a successful financing client. Qualification occurs on the first verified financing disbursement. Record amount, currency, date, provider/bank evidence reference, reviewer and timestamp. Count that canonical client once, irrespective of later drawdowns or other relationships.

**Termination:** the tail period and future-receipt entitlement remain unconfigured. Do not invent a cutoff or silently forfeit accrued balances. Hold later provider allocations for a terminated introducer pending contractual policy approval. Tax review cannot release a termination-policy hold. Suspension disables referrals while preserving settlement of already accrued obligations. Restricted settlement access also remains available after termination.

## 2. Keep four accounting streams separate

1. Applicant platform/introduction fees, including free allowances, paid credits, tax, refunds and exceptions.
2. Provider commission statements and actual cash receipts.
3. Introducer commission entitlements, reversals, invoice allocations and supplier tax.
4. Actual payment and reconciliation events.

Applicant introduction fees are not included in introducer commission. A positive provider response consumes an introduction entitlement under the approved applicant-fee policy; it is not the same event as account activation or financing disbursement. Payment does not bypass matching, eligibility, current screening, applicant confirmation or provider-specific sharing permission.

## 3. Core records and immutable links

| Record | Required keys and facts |
|---|---|
| Introducer | Immutable ID; approved individual/company identity; country/tax particulars; email; invitation/access status; independent referral-link status; canonical attribution token; achieved automatic tier; effective commercial events. Production additionally needs registration/address/signatory authority and securely verified payout beneficiary. |
| Applicant / canonical client | Immutable client ID and identity-verification basis; immutable introducer attribution or documented dispute/correction; duplicate-resolution link. Contact-email changes do not create another entity. |
| Application revision | Canonical client, case ID, services, submitted answers/revision; submitting actor; representative authority; verified applicant confirmation actor/revision; terms/privacy versions and timestamps. |
| Provider relationship | Application, canonical provider institution and product; independent status; reasoned transition history; activation or financing-disbursement evidence. |
| Effective commercial terms | Event ID, effective UTC timestamp, deterministic sequence, mode, rate, supporting contract ID/version/fingerprint; source of entitlement rule. |
| Provider statement | Provider, statement reference, issue/reporting period, immutable source document and provider line IDs. |
| Provider cash receipt | Provider, unique bank reference, currency, value date, verified cash amount, evidence and verifier, receipt ID, statement link. |
| Receipt allocation | Receipt, statement, stable statement line/allocation ID, relationship/client/period, gross, cash VAT, withholding, charges, actual cash portion, resulting posted entry or hold. |
| Commission entry | Original immutable money components, net, entitlement event, resolved terms snapshot, rate, share, provider code, canonical client, relationship, currency, posting time and original-entry link for reversal. |
| Supplier invoice | Introducer, number/revision, date/currency, uploaded invoice, entry allocations, subtotal, separate supplier VAT/tax, total, review decision and prior rejected revision link. |
| Supplier payment | Invoice, positive amount/currency, value date, unique bank reference, internal proof, recording actor, reconciliation result and append-only correction link. |
| External document derivative | Separate ID/body from internal original; explicit intended introducer recipient; original link; disclosure/redaction review reason; reviewer/time; immutable version. |

The local model has explicit `providerStatements`, `providerCashReceipts` and `receiptAllocations` collections. Single-row legacy receipt calls remain supported, but the Admin UI now supplies an independent bank total and statement reference for a one-remittance batch. Older seeded entries remain clearly fictional legacy records; they are not inferred to have externally verified receipt headers.

## 4. Receipt, tax and posting rules

All amounts are integer minor units. This prototype supports EUR, GBP, USD and CHF, each with two decimal places. No implicit currency conversion is allowed. Production must use a currency-precision table before adding other currencies.

Let G be stated gross commission, V cash VAT, W withholding, and B directly attributable charges:

- VAT included: expected actual cash = G − W − B; eligible net = expected cash − V.
- VAT added separately: expected actual cash = G + V − W − B; eligible net = expected cash − V.
- No cash VAT / reverse charge: expected actual cash and eligible net = G − W − B.

Do not deduct W/B a second time from cash that was already received net of those deductions. Actual allocated cash must reconcile with the independently entered receipt header. Manual treatment, uncertain tax, cash discrepancy or termination-tail uncertainty produces a hold, not a payable.

**Example:** G EUR1,000, separately added VAT EUR200, withholding EUR100, charges EUR20: actual cash EUR1,080; eligible net EUR880; at 30%, introducer share EUR264. Supplier invoice tax is assessed separately later.

The same bank reference can fund several different client/relationship lines. One statement line/allocation cannot post twice; one provider bank receipt reference cannot be replayed. A bad line rolls back the whole attempted batch. One generic notification is queued per affected introducer, never one sensitive email per client line. Reconcile unidentified/unallocated cash in a separate queue before commission posting. Partial cash allocations require stable separate allocation identities and a verified statement-line cap in production; the current prototype accepts distinct statement-line IDs and separate receipt references and rejects reuse.

Final posting snapshots **one deterministic effective-terms object**, used for both rate and contract linkage. Effective events sort by UTC timestamp, then stable sequence. Future terms do not supersede currently effective terms prematurely. Automatic tiers are 30%, 40%, 50% for one, two, three-or-more distinct successful clients. Highest achievement remains; closure does not downgrade it. A bespoke rate overrides the current automatic rate prospectively without rewriting previous entries.

## 5. Application and relationship status

Applications summarize all relationships, for example `1 active relationship; 1 closed relationship`. Editing one relationship never overwrites the whole application with that relationship’s status.

Normal transitions: Submitted → Matching Completed → Introduction Requested / Introduced → Onboarding → Opened / Activated → Closed. Declined/Cancelled are available before activation where appropriate. Closed, Declined and Cancelled are terminal unless a reasoned correction event explicitly reopens them. The model rejects unsupported transitions. The local status update is a demonstration; production must also require provider evidence appropriate to the transition and server-authorized reviewers.

Before introduction, require verified applicant confirmation of the current revision, current SOPHIMA due-diligence gate, provider eligibility and approved provider-specific sharing. Root billing calls use `sharingApprovals[{provider,revision,recipient,email,approvedAt}]`; current provider/revision and valid intended-recipient email must match. Explicitly marked standalone demo fixtures may bypass this integration gate for review tests. Never apply `demoFixture` to a live applicant.

## 6. Agreement workflow and document privacy

Use the full Master Agreement plus a standard or bespoke Schedule 1. The corrected prototype embeds the full reviewed clauses from `agreements/INTRODUCER-AGREEMENTS.md`, with C01 and C03 resolved and all other commercial/legal placeholders retained. “Accepted” history in this demo is a **simulated review acceptance**, not an executed contract. Downloaded drafts prominently say NOT FOR EXECUTION.

Admin publishes a version; the invited introducer reviews/accepts their own document. Admin cannot call introducer acceptance. A separate Admin evidence-import operation records the actual introducer and SOPHIMA signatories, signature date, matching version fingerprint and a restricted signed-evidence original. It does not relabel Admin as the introducer. Future accepted versions remain separate until their effective commercial event is selected.

Internal originals default to restricted access, including payment evidence and other uploaded documents. Introducer-safe agreements/invoices and explicitly approved derivatives are exposed through the external DTO and download guard. An uploaded “safe to share” checkbox no longer publishes an unrestricted original. The derivative requires a linked internal original and disclosure-review reason. Avoid provider identities, bank details, unrelated transactions, internal DD reports and third-party personal information in the external copy. Internal payment proof links are absent from introducer payment DTOs.

Prototype fingerprinting is explicitly `DEMO-FNV1A` for deterministic version comparison, **not a cryptographic signature or tamper-proof evidence**. Production requires SHA-256 document hashing, immutable object storage, authenticated signatory evidence, a real legal signature/acceptance process, version/effective-time controls, retention rules and audited expiring downloads. Placeholder SOPHIMA entity details, jurisdiction, notice/payment periods, termination tail, data roles and legal remedies must be completed before actual execution.

## 7. Invoice and settlement rules

- Accepted invoices reserve allocations; the same available commission cannot be invoiced twice.
- An invoice uses one currency and must equal its allocations plus separately reviewed invoice tax.
- Rejection releases allocations and a correction creates a linked revision, preserving the rejected document.
- Existing accrued balances of Suspended/Terminated introducers remain invoicable without reactivating their referral links.
- A recovery/clawback hold must be resolved through an agreed offset/refund or reviewed process before new invoices.
- Supplier payment date must be a real calendar date, no earlier than invoice date and not future-dated. Receipt, invoice and commercial event dates are validated separately.
- Paid and reconciled are different states. A mismatch reopens review; correction appends an evidenced record rather than editing history.
- Reversal uses the original rate and cumulative rounding so a complete reversal equals the original share exactly. A reversal is not proof that cash was recovered.

## 8. API changes for Renos

Existing signatures remain compatible except intentional validation/security corrections:

| API | Contract |
|---|---|
| `loginApplicantDemo(email)` | Local identity simulation; production must replace with verified authenticated principal. |
| `confirmApplicant(id,email,terms,privacy,revision?)` | Actor’s verified email must equal applicant; optional explicit revision must equal current revision. Records actor/revision evidence. |
| `effectiveTerms(introducer,at?)` | One deterministic rate/contract/event snapshot, using C01 final posting timestamp. |
| `acceptDoc(id,true)` | Invited owner introducer only; Admin rejected. Demo acceptance clearly recorded. |
| `importAgreementEvidence(id,record)` | Admin-only, separate actual-party evidence import; requires restricted original and matching fingerprint. |
| `documentView(id)` | Owner/role and document classification guard; internal originals excluded from introducer download. |
| `setRelationship(id,status,ddClear,evidence?)` | Allowed transition, aggregate summary, optional reasoned correction. |
| `recordFinancingDisbursement(id,record)` | First verified disbursement qualifies the canonical client, once. |
| `postProviderReceipt(header,lines)` | Independent verified receipt total, stable statement line IDs, batch rollback, holds, allocated lines. Preferred new integration. |
| `postReceipts(rows)` | Compatibility adapter that groups provider/bank-reference lines; not independent bank verification. |
| `updateProvider(id,patch)` | Only eligible/reporting/frequency/taxDefault/currency/notes/overrides allowed; invalid types/modes rejected. |
| `createInvoice(...)` | Permits accrued settlement for suspended/terminated accounts; does not reactivate referral access. |
| Billing `request` | One unit per canonical confirmed case and institution; combined product list retained. |
| Billing `introduce` / `decide` | Current exact-provider/revision/recipient sharing permission required for live-shaped cases. |

## 9. Required production boundaries

All role switches, “verified” checkboxes, cash confirmations and email-identity simulations remain browser-local review controls. They are not authentication, RBAC, actual sanctions clearance, bank verification, payment initiation or real signature evidence. Server APIs must validate every input, authorisation and record-ownership scope; no external user receives the internal store. Require transactional/idempotent posting, verified bank/gateway events, maker/checker for payouts and adjustments, supplier-bank-change verification, crypto hashes, structured retention, signed download access, and an append-only audit trail. Reject unknown tax modes, currencies, patch keys and impossible dates at the service boundary even if the HTML form also validates them.

No arbitrary termination-tail decision or legal contract completion has been invented. Those remain configuration/legal-review gates. No invitation, agreement, statement notice or provider email was sent during this implementation.

## 10. Verification and files

Business verification: **26 existing introducer tests + 64 existing facilities/billing tests + 26 new targeted accounting regressions = 116 passing tests**. The new tests reproduce all seven audit probes as rejection/correctness assertions and cover combined quota, financing disbursement, term ordering, restricted originals, external derivatives and scoped sharing. 13 browser smoke checks passed at 1280/390 pixels with zero page errors; results are in `ACCOUNTING-BROWSER-VERIFICATION.json`.

Corrected sources: `prototype/intro-model.js`, synchronized `modules/introducer/model.js`, introducer `prototype.js`, `prototype/billing-model.js`, synchronized `modules/facilities/model.js`. Full contract drafts: `agreements/INTRODUCER-AGREEMENTS.md`. Targeted tests: `verification/verify-accounting.cjs`; result: `verification/ACCOUNTING-VERIFICATION.json`.
