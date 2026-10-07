# FinSyndeo implementation specifications

Delivery to Renos. English edition dated 7 October 2026, incorporating Marios's approval of the 6 October audit proposals and the instruction to offer English only. SOPHIMA operates as an introducer, based on the business description supplied by Marios. These specifications define the intended production behaviour; the included browser prototype demonstrates workflows without providing a production backend or legal certification.

## How to use this delivery

Open START-HERE.html, then the complete platform. Review each role through the clearly marked prototype role switcher. Read this document together with the applicant specification, matching specification, accounting specification, approved field wording, privacy and screening requirements, email templates, agreements, and report examples. They describe one product. Superseded packages and screenshots must not determine implementation.

The prototype is plain HTML, CSS and JavaScript. It can be opened from an extracted local folder or served as static assets. It is not a Visual Studio solution. Renos can build an ASP.NET Core solution using Kestrel, or another agreed server stack, while using this folder as a behavioural reference. Hosting the HTML does not activate authentication, server persistence, screening, AI, payments, document extraction or email delivery.

## Product boundaries and roles

Applicants sign in before saving an assessment. Public account choices are Applicant and Provider institution. Introducers are invited and approved by SOPHIMA; they are not a public registration category. Admin access is restricted. A user may have separately authorised memberships, but changing a client-side role never grants permissions. The prototype switcher exists only for review and must not ship to applicants in production.

Applicants can create, resume, correct, confirm, withdraw and request deletion of their own records. They can compare anonymous provider options, request introductions, approve an identified recipient and profile revision, manage future-provider alerts and inspect their own payment status. The questionnaire and AI-assisted intake populate the same field schema and require the same final confirmation.

Provider users manage their own institution profile, products, acceptance rules, internal documents, reporting preferences and authorised case reports. A draft cannot overwrite the last approved published policy. Availability is controlled by SOPHIMA. Providers cannot view other institutions' records or browse the prospect database.

Introducers manage their own agreements, referral link, attributed referral history, commission ledger, invoices, documents and reconciliation history. They do not receive unrestricted client KYC files or provider policy documents. The referral token identifies attribution and is never a login credential. SOPHIMA controls invitation, approval, access, agreements, provider participation, exceptional rates and accounting approvals.

## Screen inventory and journeys

### Applicant workspace

Dashboard contains Find a Provider and My assessments. Find a Provider offers Questionnaire or Guided intake. Meeting booking, calendars and interview booking are removed. My assessments is the saved-record list, not a third intake method. It displays draft or submitted state, route, attribution and actions to resume, edit or inspect results.

The visible applicant selector offers Individual, Legal entity and Financial institution. Individual leads to private banking. Legal entity offers Bank account, Merchant account, Both bank and merchant accounts, or Financing. Financial institution leads to correspondent and payment accounts. Switching service changes the applicable questions and steps; it never silently routes a bank applicant into merchant questions.

Shared legal-entity information is collected once: company name, incorporation country, mandatory registration number, legal form where applicable, website optional, industry, detailed business activity, licences where applicable, offices and staff. Shared ownership and contact information is reused for combined applications. Merchant-only applicants requesting help with a settlement bank add the bank flow module to that same application. They do not start a second form.

Bank route: Company → Business activity → Bank account purpose and flow of funds → Ownership and control → Contact → Your assessment summary. Both route uses the shared first two steps, an explicitly named Bank account and flow of funds step, then distinct Merchant steps. Merchant questions must be labelled Merchant throughout. Financing replaces account flows with financing purpose, amount, use, project stage, audited year, existing facilities, relevant collateral and desired timeline. Correspondent accounts use separate operational own-funds and client-funds flows. Private banking starts with name and surname, nationalities, residence and tax countries, followed by needs, liquid assets in EUR, intended placement, currencies, relevant wealth and funding categories, existing banking, contact and final summary.

The exact conditional fields and IDs are in the applicant specification and field dictionary. Your assessment summary is always the last questionnaire step. It provides section-specific Edit actions, clearly marks missing information and requires confirmation before matching. Back navigation and reload preserve all inputs, repeatable rows and optional selections.

### Results and introductions

Show only eligible potential options as actionable matches. Show conditional options separately with the information or provider confirmation still needed. Unsupported or policy-held options are not presented as eligible. Anonymous provider codes identify comparison cards; institution names are disclosed for the selected sharing authorisation before an introduction is sent.

Separate essential support, preference fit and evidence coverage. Fit is not the probability of acceptance. Preferences can improve ranking only after essential criteria pass. If no scored preferences were supplied, display Not scored. Ratings, commissions and introduction fees must not change suitability. Sorting must be deterministic and expose the selected sort criterion. Provider descriptions and confirmed benefits may help a client decide; internal policy documents never leave SOPHIMA.

The number of available solutions may change as the applicant completes the form. Show supported and conditional counts independently. An impact explanation can show that a preference narrows options, but must not encourage false declarations or present a prohibited country as removable preference. Recalculate after relevant applicant, provider, policy or source changes. Do not reuse stale fit percentages.

Introduction allowance belongs to the canonical client, not the login or repeated application. The existing configurable free allowance and additional-introduction charge are prototype business settings. An introduction to one institution for a confirmed combined bank and merchant case consumes one entitlement. Two institutions consume two. Product relationships and provider commissions remain separate.

For an additional paid introduction, show an accepted, immutable quote with currency, applicable charge and tax treatment, provider code, service scope, expiry and cancellation/refund terms before checkout. Tax treatment and mandatory consumer information must be configured and validated before production. Pending, failed or cancelled payments do not establish paid entitlement. A verified gateway event and server reconciliation determine payment success. Replay must not charge or grant twice.

Future-provider alerts are optional and case-specific. The applicant chooses a fit threshold, can amend it or disable it, and is asked to reconfirm annually under the approved design default. Dispatch only for a newly eligible provider/current policy that meets the threshold and current declaration. No match score may bypass a mandatory restriction. Use deduplication and revalidate consent and eligibility at send time.

### Provider workspace

Institution Apply collects verified institution identity, incorporation, establishment year, website, licence/registration type and reference, regulator, permitted activities and authorised contact. Account delivery is explicitly by the institution itself. Do not add a separate intermediary delivery choice. Minimums and eligibility conditions are product-specific.

Provider products use the same service, facility, industry, currency, payment-network, IBAN and geographic definitions as applicants. Bank/private/correspondent product headings explain what their accounts can serve or offer. Financing uses Financing facilities for. Private banking declares minimum initial deposit and minimum amount allocated to an investment product separately. Payment rails include SWIFT, SEPA, instant SEPA where applicable, Open Banking, TARGET, ABA and Faster Payments according to actual supported definitions; do not treat every rail as interchangeable.

Dedicated IBAN support is Yes or No, with actual IBAN issuance countries when Yes. Required physical offices and at least one employee other than the director have explicit mandatory provider answers. Startups with no transaction history use Supported, Not confirmed, Not supported or Case by case. Do not collect a second minimum operating-history field.

Each geographic axis is distinct: applicant incorporation, individual residence, tax country, nationality, UBO nationality/residence, shareholder jurisdiction, incoming and outgoing corridors, project location and underlying-client markets where applicable. A provider can tick supported/prohibited countries and industries or upload a policy list. List scope, positive/negative meaning, default for unlisted items, applicable product, effective date and review date must be confirmed. Unknown is not Supported. Case by case is conditional, not eligible.

Any internal document may be uploaded for SOPHIMA analysis. The original and its extracted text remain confidential. Parsed rules are proposals until an authorised review confirms mappings and resolves conflicts. Published revisions are immutable. Account availability is an Admin control, not a provider questionnaire field. Pricing is negotiated from risk assessment and the provider/introducer relationship; the removed fixed-pricing tab must not reappear.

A signed SOPHIMA referral agreement is required before listing. Introducer participation additionally requires analytical commission reporting per client. This is a separate eligibility requirement from general applicant support. Reporting preferences allow selected periods and ad hoc reports; provider reports show only permitted relationship fields and recipients. Incoming commission statements are a different workflow from outbound case reports.

## Stable schema and data relationships

Use durable IDs and typed values rather than displayed labels or element array positions. Schema versions must have explicit migrations. Preserve repeatable person, entity, counterparty, licence, offer, document and receipt-line IDs across edits. Labels may change without altering meaning. Conditional hidden values must not silently remain active requirements; preserve them as inactive draft values where useful.

Canonical client identity is a verified person identifier or entity jurisdiction and registry identifier, with a controlled duplicate-resolution process. An email address alone does not prove a person is the same client. Changing email must not reset introductions or referral attribution. Conflicting attribution becomes an Admin exception, not a last-click overwrite.

Core relationships are UserAccount → Membership → Applicant → Application → immutable AssessmentRevision. Persons and entities link through declared/evidenced OwnershipEdge records. ServiceRequirement and CountryExposure records are scoped to the service, account and transfer direction. Provider → Offer → immutable ProviderOfferRevision → AcceptanceRule and evidence. MatchSnapshot references exact assessment, provider and regulatory versions.

Introducer → ReferralAttribution → canonical Client → Application → ProviderRelationship → CommissionAllocation → InvoiceAllocation → PaymentAllocation. ProviderStatement, actual ProviderCashReceipt and allocated statement lines are separate. A remittance covering several clients has one header and several allocations. Applicant introduction payments and introducer commissions have different ledgers.

Minimum common metadata: record ID, owner/tenant, schema version, created and changed timestamps, creator/actor, status, revision, provenance, evidence references and valid-from/review dates where applicable. Money uses integer minor units and explicit ISO currency. Share percentages use fixed decimal precision. No floating-point ledger arithmetic. Currency conversion requires recorded rate, date, source and decision; never aggregate nominal EUR and USD amounts as one balance.

### Principal record contracts

AssessmentRevision stores declarations, applicable field set, validation outcome, confirmation actor/time, referral context and previous revision ID. Person stores name, aliases where needed, nationality array, residence, relevant identifiers and role; no threshold is a substitute for identifying actual control. Counterparty stores optional name, type, country, account scope, direction and relationship. Evidence stores source, retrieval time, page/reference, hash, factual assertion, verification state and access classification.

SharingApproval stores applicant or verified representative identity, authority record, application revision, exact institution legal identity, service-specific recipient, purpose, data/document manifest, privacy notice version, time and withdrawal state. It is not a global boolean. An Admin checkbox cannot create applicant consent.

ScreeningRun stores subject IDs, enabled lawful screening scopes, rule/list versions, source health, retrieval timestamps, candidate matches, resolution evidence, decision, reviewer and expiry. MatchSnapshot stores each criterion result, essential/preference classification, explanations, eligible/conditional/unsupported state, score and coverage. Neither record can assert that an unavailable service returned No hit.

OutboxEvent stores template ID/version, business event, idempotency key, case revision, verified To and CC, attachment manifest/hashes, permission snapshot, readiness snapshot, state, attempts and delivery evidence. PrivacyRequest stores request kind/scope, proportionate identity check, receipt date, response deadline, restrictions, exemptions, action/processor logs and final outcome. RetentionHold includes reason, basis, limited record scope, reviewer and expiry/review time.

## Workflow state machines

Application: Draft → confirmed revision → current matching, clarification, screening hold or policy exclusion → institution selected → sharing authorised → checks and entitlement resolved → SOPHIMA release approved → sent → delivered or failed → institution onboarding. Applicant editing creates a revision and invalidates the old matching, due-diligence readiness and sharing approval. Historical revisions and decisions remain distinguishable; an old clearance cannot approve changed information.

Provider profile: Draft → submitted → reviewed → published, returned for clarification or rejected. Submitting a replacement does not discard the last approved revision. Listing can be paused independently of existing client relationships. Expired policy support cannot remain silently confirmed; it becomes conditional pending refresh.

Introducer: Invited → access verified → agreement accepted by authorised signer → approved → active, suspended or terminated. Admin can import independently signed evidence with provenance but cannot sign as the introducer. Suspension stops new referrals while preserving settlement access for earned liabilities. Financing qualifies as a successful client only after an evidenced first disbursement. Post-termination accrual waits for configured contractual entitlement; already earned settlement is not invented away.

Commission: provider statement → cash reconciliation → client allocation → approved ledger posting → invoicable → invoiced → partially paid or paid. Rate locks at final approved posting under the retained C01 interpretation. Agreement/rate events are effective-dated; calculate using one deterministic ordering when events share a timestamp. Posted entries retain their original terms. Correct with a linked reversal and replacement rather than rewriting history.

Privacy: received → identity/authority confirmed → processing restricted where appropriate → retention/exemption assessed → deletion/correction propagated → recipient notifications where applicable → explanation and completion. Account closure, consent withdrawal, application withdrawal and erasure are different events. Do not claim all records were deleted when legitimate limited accounting records remain.

## API contracts for the production backend

All endpoints require authenticated server authorisation and object ownership checks. UUIDs or opaque IDs are identifiers, not permissions. Use ETag/If-Match or equivalent optimistic concurrency for revision updates. Errors return a stable machine code, field IDs when applicable, a plain user explanation, correlation ID and retryability. Do not expose sanctions allegations or private documents in error messages.

| Operation | Suggested endpoint | Required behaviour |
|---|---|---|
| Save draft | PATCH /api/applications/{id}/draft | Allowlisted typed field patch, schema version, ownership and ETag check; no positional restoration |
| Confirm application | POST /api/applications/{id}/revisions | Validate all applicable required fields; freeze declaration and actor authority; compute hash |
| Match | POST /api/applications/{id}/matches | Current confirmed revision; return eligible and conditional separately with criterion evidence |
| Provider draft | PUT /api/providers/{id}/offers/{offer}/draft | Provider membership; product-specific policy and version; no implicit publication |
| Parse internal document | POST /api/providers/{id}/documents/{doc}/extractions | Scan file, restrict extraction scope, produce proposed rules only |
| Publish profile | POST /api/providers/{id}/publications | Authorised Admin; agreement/evidence/rule validation and approved revision |
| Request introduction | POST /api/applications/{id}/introductions | Current eligible scope; canonical entitlement and duplicate key |
| Approve sharing | POST /api/introductions/{id}/sharing-approvals | Applicant/verified representative; actual institution, recipient, revision and manifest |
| Create checkout | POST /api/introductions/{id}/checkout | Accepted quote; gateway order, currency, immutable amount and idempotency |
| Payment webhook | POST /api/payments/webhooks/{gateway} | Verify signature, timestamp, amount and order; idempotent reconciliation |
| Release introduction | POST /api/introductions/{id}/release | Required live checks and permission revalidated server-side; controlled final release |
| Update alerts | PUT /api/applications/{id}/alerts | Explicit opt-in, threshold, reconfirmation and unsubscribe state |
| Confirm referral | POST /api/referrals/{id}/applicant-confirmation | Verified actor and authority; client-supplied email cannot impersonate applicant |
| Accept agreement | POST /api/agreements/{id}/acceptance | Exact version and signer identity; evidence and audit record |
| Allocate receipt | POST /api/provider-receipts/{id}/allocations | Reconciled header and client relationships; allocation sum cannot exceed receipt |
| Post ledger | POST /api/commission-allocations/{id}/posting | Deterministic effective contract/rate; approved immutable transaction |
| Submit invoice | POST /api/introducers/{id}/invoices | Authorised introducer; currency, payee and earned available allocation checks |
| Record payment | POST /api/invoices/{id}/payments | Admin evidence, actual receipt/reference, remaining payable limits |
| Request privacy action | POST /api/me/privacy-requests | Purpose/scope and deadline; no universal destructive cascade |
| Export own data | POST /api/me/data-exports | Secure download with expiring owner access; exclude unrelated third-party/internal material |

Use idempotency keys on confirm, checkout, release, receipt posting, invoice submission, payment and outbox jobs. Return the prior result on a valid replay. Reject a reused key with a conflicting payload. Use database transactions and uniqueness constraints to enforce invariants; UI checks alone are insufficient.

## Screening and legal rule implementation

All declared countries remain available for truthful reporting, including nationality, residence and tax residence. Countries are canonical validated values. EU selection is an expandable transfer-flow group only; it is not a nationality or tax country. Merchant country percentages must sum to 100 without duplicate country entries.

Keep applicable legal prohibitions, sanctions designations and ownership/control rules separate from FATF/EU risk designations, SOPHIMA commercial policy and individual provider acceptance. FATF monitoring is not a sanctions list. Do not infer a legal prohibition for every national of a listed country. Apply explicit combination rules and relevant territorial/person/service scope. A commercial No-go is labelled policy exclusion; a sanctions obligation cites the applicable law/rule and evidence internally.

UN, EU, OFAC and UK source ingestion requires versioned official feeds, integrity/health checks, freshness SLAs, failed-update handling and current release-time checks. The current UK source is the UK Sanctions List; the former OFSI consolidated list was closed in January 2026. FATF lists and EU AML high-risk countries are separate risk inputs. The detailed screening source and continuity specification defines the adapters and test conditions. No deployment may label a stale or unavailable required check as clear.

Named applicant entities, relevant owners/controllers, directors and declared related entities/counterparties are screening subjects with IDs and provenance. Use sufficient identifying details to resolve name similarities; do not automatically reject a fuzzy hit. PEP screening applies to people. A PEP finding calls for the appropriate review rather than automatically establishing prohibited status. Related-interest diagrams must distinguish declared, registry-derived, verified and unresolved edges; unknown affiliations are coverage limitations.

Website analysis retrieves dated sources safely, extracts activity observations and compares them with the declaration. It reports consistency, discrepancies and unavailable evidence. It cannot certify that a business is legitimate based on a website. Licence verification checks actual licence holder, regulator, reference, authorised activity, relevant country and current validity. FINTRAC registration is not a banking licence; Bank of Canada registration is assessed within its applicable scope. CASP/MiCA questions depend on actual crypto services and relevant jurisdiction.

GDPR processing requires a purpose/person/basis register and minimisation. SOPHIMA's introducer-only description does not establish a blanket bank AML five-year retention duty. Consent is not the universal basis for every processing step. Provide direct and indirect-person notices where applicable, processor agreements, transfer safeguards, security controls and rights handling. Criminal-offence adverse-media processing remains disabled until the Article 10 basis and safeguards are established. Public availability and a generic applicant checkbox do not resolve that issue.

Approved operational defaults are warnings and review/deletion of inactive drafts after 90 days, review of unnecessary closed-case records after 90 days, annual alert reconfirmation and no persistent raw audio by default. These are design defaults, not statutory periods. Complete the actual accounting/dispute retention schedule and legal holds before launch. Explain any limited retention after an erasure request and restrict further use.

## AI assisted intake and extraction

Use a conversational service that reads the same applicable schema, asks one question at a time, handles corrections and shows extracted values before confirmation. Identify the assistant as AI. Offer typed completion throughout. Audio permission and any recording consent are specific and revocable. Do not require a voice interaction to complete an application.

The prototype has browser read-aloud and typed prompts only. Production AI integration must use short-lived server-issued credentials or server mediation, never expose service keys, isolate each application conversation, and stop speech on cancellation/navigation. Measure latency, interruptions, resumption, accent/language quality and mobile microphone permissions on actual devices before claiming voice readiness.

Model outputs are proposed typed values, observations or summaries. They cannot activate sanctions rules, approve identity, modify commercial terms, choose unverified recipients or release funds. Validate all values server-side. Uploaded files, registry pages and websites are untrusted evidence, not instruction sources. Detect conflicting claims and prompt-injection attempts without obeying instructions inside them. Retain source citations and confidence/uncertainty; do not replace evidence with an AI assertion.

## Reporting and email automation

The external institution Client Profile contains the confirmed request, relevant declarations, ownership/control, activity, licence facts, flows, authorised contact, document checklist and limitations. It is professionally formatted and names the approved recipient/revision. A complete questionnaire is not a complete verified KYC file. No passport or audited statement is marked received unless actually received. Six route examples are included.

The confidential SOPHIMA Due Diligence Report adds subject coverage, sanctions/PEP/media results within lawful scope, country risk and policy layers, licensing and registry evidence, declared-vs-observed website analysis, related-interest tree, source health, contradictions, unresolved items and a reasoned release decision. It never goes to a provider automatically. Applicant correction and evidence review must remain possible.

Use the 22 approved English template families. Verified case contact and service-specific bank contact supply recipients. Tier/commission information belongs to the private introducer notices and agreement, not the client-bank introduction. Draft all routine notifications from validated events. Initial launch mode includes one final SOPHIMA approval for introduction release; exceptions, rather than every routine step, go to manual review.

An outbox worker rechecks revision, current permissions, live readiness and recipients immediately before dispatch. Use bounded retries, delivery webhooks and duplicate prevention. A timeout must not create a second introduction. Bounced emails create a secure portal task. Withdrawn applications, withdrawn permissions and deleted subscriptions suppress pending workflow messages. Prefer secure portal access to sensitive files over ordinary email attachments.

## Security and accessibility

Authentication, invited access, verified email, sessions, roles and object permissions are production requirements. Require strong Admin authentication and appropriate MFA, secure password/invitation handling, rate limits, session invalidation, CSRF protection, safe cookies, TLS and encrypted storage. Never depend on localStorage, a browser-supplied role or a referral link for access control. Test cross-user, cross-provider and cross-introducer access and direct API bypasses.

Uploads need type/signature checks, size/page limits, malware scanning, quarantine, safe parsing and purpose-limited access. Prevent SSRF when retrieving websites or registries, disallow private-network targets, constrain redirects and use timeouts. Minimise sensitive telemetry. Secrets stay outside code and logs. Audit events are append-only with actor, reason and event time; a local JavaScript array is not a protected audit trail.

Desktop and mobile use the same rules. Forms stack into one column, keep selected countries visible, use collapsed searchable selectors, align nationality/residence cells and avoid horizontal scrolling. Provide labelled fields, keyboard navigation, clear required markers, errors near fields and a summary focused on the first invalid field. Show why Continue was stopped. No fixed text-length rule may force invented information. Aim for WCAG 2.2 AA and test manually with keyboard and assistive technology; viewport geometry alone does not prove conformity.

## Build acceptance and production launch gates

The included test evidence covers the local prototype and named regression cases. Renos must implement equivalent server tests, integration tests and real-device acceptance. Every essential applicant criterion needs a matching provider axis, and every conditional field must be tested when shown, hidden, restored and changed. The same tests must run through form entry, AI extraction, imports and APIs.

Before launch, prove verified identity/authority, owner-level access control, current lawful source availability, provider publication/expiry, true scoring, canonical quotas, payment webhook integrity, immutable accounting, applicant recipient/revision approval, email deduplication, rights/retention propagation, confidential report separation and live voice behaviour. Complete contracting entity particulars, agreement execution terms, tax/cancellation information and retention register. These are explicit implementation prerequisites, not permission to fabricate defaults.

No timeframe or cost assumptions are part of this specification. Marios reviews the prototype and approves production implementation separately. An approved prototype is not approval to publish or begin live financial introductions.
