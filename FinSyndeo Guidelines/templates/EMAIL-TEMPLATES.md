# FinSyndeo email templates and delivery rules

Approved design reference dated 6 October 2026; delivery 7 October 2026. Builds on Marios's Email templates chat. None of these emails is sent by this review. Replace placeholders only from verified records, never from model guesses. Templates must be versioned, maintained in English and previewed before activation.

## Shared delivery rules

Use the authenticated case contact and verified provider contact for the selected service. If a contact is missing, stale or ambiguous, hold the draft for clarification. Do not invent an email or choose the first unrelated banker. Select To and CC deliberately. Do not include introducer tier or commission in bank/client introduction emails. Tier information belongs only in the introducer's private agreement and notices.

The first provider shortlist is anonymous. Before sharing, show the actual institution legal name, the authorised client profile revision, intended recipient and privacy notice to the applicant. Record approval. On-behalf submission requires real applicant/authorised representative confirmation, not an Admin check in the introducer's place.

Transactional notifications can be generated automatically from validated events. An introduction send must additionally pass current identity/authority, regulatory, provider, applicant-sharing and applicable entitlement/payment checks. Initial proposed launch mode: generate everything automatically and use one final SOPHIMA approval before release. Straight-through release may be enabled later only for an explicitly approved low-risk policy with legal/Article 22 safeguards. Exceptions go to review, not silent auto-approval.

Use an outbox with an idempotency key, approved template version, case revision, recipient list, attachment hash, permission snapshot, delivery status and retry limits. Revalidate at actual send time. A failed acknowledgement must not send a duplicate introduction. Record bounced/failed messages and offer a secure portal task. Never put passports, raw KYC reports, sanctions allegations or provider policy documents into routine email bodies. Prefer authenticated portal links for sensitive profiles; authorised attachment delivery requires its own safeguards.

## E01 Account email verification

Audience: the account owner. Trigger: account creation; send automatically with expiring single-use verification link.

Subject: Verify your FinSyndeo email address

Hello [first name],

Please verify your email address to access your FinSyndeo account: [verification link].

This link expires at [expiry]. If you did not request this account, you can ignore this message.

FinSyndeo by SOPHIMA

## E02 Application saved or submitted

Audience: applicant. Trigger: initial confirmed submission, not every autosave.

Subject: Your FinSyndeo application [case reference]

Hello [first name],

Your request for [service] has been saved under reference [case reference]. You can review your answers and available next steps in your account: [secure case link].

No financial institution has approved your application at this stage.

FinSyndeo by SOPHIMA

## E03 Clarification needed

Audience: applicant or verified authorised contact. Trigger: validated missing-information task.

Subject: Information needed for your FinSyndeo request [case reference]

Hello [first name],

Please clarify the following information so we can continue assessing your request:

[Specific questions tied to the applicant declaration]

Please update your application securely here: [case task link]. Avoid sending sensitive identity information by ordinary email.

FinSyndeo by SOPHIMA

## E04 Potential providers available

Audience: applicant. Trigger: current confirmed assessment with verified eligible results.

Subject: Review potential providers for [case reference]

Hello [first name],

Potential options are available for your [service] request. Sign in to compare how they meet your essential requirements and preferences: [results link].

A potential match is not an offer, account approval or guarantee of acceptance. You choose whether to request an introduction.

FinSyndeo by SOPHIMA

## E05 No current provider found

Subject: Update on your FinSyndeo request [case reference]

Hello [first name],

We have not identified a provider in our current network that supports the requirements declared in your application. You can review your preferences or enable alerts for future suitable providers here: [case link].

This is not a rejection by a financial institution.

FinSyndeo by SOPHIMA

## E06 Eligibility review or policy exclusion

Subject: Update on your FinSyndeo request [case reference]

Hello [first name],

Use exactly one status paragraph:

- **Review pending:** Your request requires further review before we can offer an introduction. We will notify you through your account when the review is complete or if clarification is needed.
- **Current policy exclusion:** Based on the information provided, your application falls outside FinSyndeo's current eligibility criteria. We cannot offer provider matching or arrange an introduction for the requested service at this time.
- **Temporary check unavailable:** We are temporarily unable to complete a required pre-introduction check. Your request is on hold; this does not indicate a decision by a financial institution.

You can correct your information or request an eligibility review here: [secure link].

FinSyndeo by SOPHIMA

Never disclose restricted compliance findings through this general template.

## E07 Applicant confirmation for an introducer submission

Subject: Please confirm the request submitted on your behalf [case reference]

Hello [first name],

[Introducer name] has submitted a [service] request on behalf of [applicant name]. Please sign in using your own verified account to review the information, confirm the authority and approve or correct the request: [single-use claim link].

No introduction will be arranged until the required confirmations and checks are complete. If you did not authorise the submission, please report it through [secure support route].

FinSyndeo by SOPHIMA

## E08 Introduction requested and sharing approval

Subject: Confirm your requested introduction [case reference]

Hello [first name],

You requested an introduction to [institution legal name] for [service]. Please review the client profile, recipient details and institution privacy notice, then confirm the information you authorise us to share: [secure confirmation link].

Any applicable introduction charge will be shown before payment. Your request remains subject to current pre-introduction checks and the institution's own assessment.

FinSyndeo by SOPHIMA

## E09 Official introduction master template

To: [verified banker email for selected service]
CC: [verified authorised applicant contact email; approved additional contacts only]
Subject: Introduction [applicant legal name] | [service] | [case reference]

Dear [banker first name],

I am pleased to introduce [applicant name], [represented by authorised contact name and role, for an entity], regarding [concise requested service].

Based on the information provided and our preliminary review, the request appears relevant to [institution legal name]'s declared services and acceptance criteria. This introduction is subject to your institution's own eligibility, compliance and onboarding assessment.

Client overview

- Applicant: [name]
- Incorporation or residence: [country appropriate to route]
- Business activity or professional background: [applicant-confirmed summary]
- Requirement: [essential services and currencies]
- Relevant amounts: [account flow / processing volume / expected placement / financing request; explicit currency and period]

[The applicant-authorised client profile is attached / available through the authorised secure link. Include only the actual method used.]

[Applicant contact first name], [banker name and title] is the designated contact at [institution legal name] for this request. I have copied you both so you can continue the discussion directly.

The profile records preliminary information and does not represent completion of the institution's KYC or a commitment to accept the client.

Kind regards,
[Approved SOPHIMA sender name and title]
[Verified SOPHIMA contracting entity] | FinSyndeo

Route-specific summary inserts:

| Route | Required summary |
|---|---|
| Bank | Account purpose, essential currencies, incoming/outgoing amounts and counts per month, corridors |
| Merchant | Channel, activity, card-origin countries and shares, processing amount/count, settlement need, optional stated chargeback/fraud/price |
| Both | Separate bank-flow and merchant-processing sections; do not sum or double-count them |
| Financing | Amount/currency, purpose/use, stage, latest audited year as declared, existing financing/security and timeline |
| Private banking | Residence, requested services, liquid asset band and intended placement separately, funds/wealth origins as declared |
| Correspondent/payment | Institution type, verified permission scope, operational and client-funds flows separately, underlying clients, IBAN/API requirements |

## E10 Introduction sent

Subject: Your introduction to [institution name] [case reference]

Hello [first name],

Your authorised introduction has been sent to [banker name and institution] for [service]. You can view the introduction status in your account: [secure case link].

The institution will contact you directly and apply its own assessment and onboarding procedures.

FinSyndeo by SOPHIMA

Trigger only after recorded successful handoff to the delivery service; distinguish accepted-for-delivery from actual confirmed delivery in portal status.

## E11 Additional introduction payment

Subject: Payment confirmation for [case reference]

Hello [first name],

We received [amount and currency] for [specified introduction entitlement]. Reference: [payment reference]. Your receipt and current request status are available here: [secure link].

Payment does not guarantee institution acceptance or override pre-introduction checks. The terms and any refund/credit outcome shown at checkout apply.

FinSyndeo by SOPHIMA

Send only from verified payment events. Failed, pending, cancelled, refunded and credited outcomes each need their own accurate status message. Do not hardcode EUR 250 or a fourth-request fee outside approved configuration.

## E12 New suitable provider alert

Subject: A new potential provider for your FinSyndeo request

Hello [first name],

A newly available provider meets all your current essential requirements and your chosen fit threshold for [case reference]. You can review the updated anonymous options here: [secure results link].

Potential matches remain subject to current checks and the provider's own assessment. You can change your threshold or turn off alerts in your account: [preferences link].

FinSyndeo by SOPHIMA

Send only with active permission, current assessment, genuine scoring and fresh eligibility. No provider identity or invented percentage in the message.

## E13 Provider invitation and application

Subject: Complete your FinSyndeo provider profile

Dear [provider contact name],

Please complete your institution's services and client acceptance criteria through this secure invitation: [invitation link]. You can upload internal policies to help SOPHIMA assess suitable prospects.

Documents remain for SOPHIMA's authorised internal use. Listing requires verified authorisation, an approved profile and a current referral agreement. Your institution's name remains hidden in applicant shortlists until the approved introduction process.

FinSyndeo by SOPHIMA

## E14 Provider profile decision or material update

Subject: Your FinSyndeo provider profile [reference]

Dear [contact name],

Use the actual status paragraph:

- **Approved:** Your provider profile, version [version], has been approved and is effective from [date]. Prospects will be assessed using the approved criteria.
- **Clarification:** We need clarification of [specific profile items] before we can publish this version. Any existing approved version remains in effect only if it is still valid and active.
- **Paused:** Your provider listing is currently paused under [recipient-appropriate explanation]. Please review the required action in your account before submitting an updated profile.

Please review it here: [secure profile link]. Updates to acceptance criteria require the applicable review before they affect matching.

FinSyndeo by SOPHIMA

## E15 Provider case report available

Subject: Your FinSyndeo case report for [period]

Dear [contact name],

Your authorised [report type] covering [period] is available here: [secure report link]. The report includes only the permitted fields for your institution.

FinSyndeo by SOPHIMA

## E16 Provider commission reporting request

Subject: Commission report requested for [agreed period]

Dear [provider contact name],

Please provide the agreed analytical commission report for [period], identifying the relevant client and provider relationship for each commission entry, with the agreed currency, net commission, applicable tax breakdown and receipt reference.

Include the stable statement-line reference, commission amount and its gross/net definition, VAT treatment, any withholding or directly attributable charges and provider payment reference where available. SOPHIMA separately reconciles actual cash received; the report is not itself proof of bank settlement.

Submit it through [secure portal link]. This request is distinct from FinSyndeo's outgoing case reports.

Kind regards,
[Approved SOPHIMA sender]

## E17 Introducer invitation and agreement

Subject: Your FinSyndeo introducer invitation

Dear [introducer contact name],

SOPHIMA has invited you to review the Introducer Agreement and your commission schedule through [secure invitation link]. Your schedule is [standard tier schedule / agreed bespoke schedule], version [version].

Please review and accept using your own verified account. Your referral link provides attribution only and is not a login credential.

FinSyndeo by SOPHIMA

## E18 Introducer rate change

Subject: Your FinSyndeo commission schedule update

Dear [contact name],

Your applicable commission rate is [rate]% from [effective date], under [agreement/schedule version and reason suitable for recipient]. The rate applies to [precise agreed scope and calculation basis]. Posted historical entries retain their original terms unless a documented correction is required.

Review the schedule and any required acceptance here: [secure link].

FinSyndeo by SOPHIMA

Do not mention a standard tier where a bespoke rate applies. Do not expose internal review notes.

## E19 Introducer commission and invoice availability

Subject: Commission statement available for [period]

Dear [contact name],

Your commission statement has been updated. Sign in to review the entries available for invoicing under your agreement and upload your invoice securely here: [ledger link].

FinSyndeo by SOPHIMA

## E20 Introducer invoice or payment status

Subject: Your invoice [invoice number] [status]

Dear [contact name],

Your invoice is [received / clarification required / approved / partially paid / paid]. Please review the actual amounts, payment status and any required action in your secure account. [Specific nonsensitive clarification, if needed.]

Supporting status information is available here: [secure invoice link].

FinSyndeo by SOPHIMA

## E21 Deletion request acknowledgement and outcome

Subject: Your FinSyndeo data request [request reference]

Hello [first name],

We have received your request to [close the account / delete personal information / withdraw an application]. [Immediate effects already performed, such as alerts stopped.]

We will review the request and respond within the applicable data-protection timeframe. If information must be retained under a lawful exception, we will explain the categories, reason and retention period.

Expected response date: [calculated due date]. If a lawful extension is needed, we will inform you within the applicable period and explain the reason.

FinSyndeo by SOPHIMA

Outcome wording:

Your request [reference] has been reviewed. We have completed [actual deletion, correction, restriction or account actions]. We retain [specific limited categories] for [documented purpose and basis] until [date or meaningful retention criterion], with access and use limited accordingly. [Relevant recipients have been notified where required / actual documented recipient-notification status.]

Information already lawfully held by an institution is subject to that institution's own duties and privacy notice. You can request clarification or exercise your rights through [privacy contact / secure route], and you have the right to complain to the competent data-protection authority.

Recipient-notification variant, only where required and after the action is confirmed:

Subject: Personal-data update for introduction [case reference]

Dear [authorised institution privacy contact],

SOPHIMA has [corrected / erased / restricted] [specified data previously shared] relating to [necessary subject/case identifier]. Please assess the corresponding information under your applicable obligations. The updated authorised information and action details are available through [secure restricted link]. This notice does not require erasure of records that your institution must lawfully retain.

Do not promise deletion by recipient institutions, expose unrelated internal findings or claim erasure of legally retained records.

## E22 Admin exceptions

Subject: FinSyndeo action required [case or incident reference]

[Feed stale / unresolved screening match / unclear authority / missing provider contact / payment mismatch / provider-policy conflict / delivery failure]

Review the restricted task here: [authenticated Admin link].

Do not include sensitive details in the subject or message; role permissions apply at the link. Batch routine notices to reduce manual noise. Security or compliance critical failures trigger the approved escalation independently of ordinary notifications.
