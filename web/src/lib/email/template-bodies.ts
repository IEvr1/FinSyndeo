/** Approved English bodies — FinSyndeo Guidelines/templates/EMAIL-TEMPLATES.md (2026-10-06). */
export const EMAIL_TEMPLATE_VERSION = "2026-10-06-approved";

export const EMAIL_TEMPLATE_BODIES: Record<string, string> = {
  E01: `<p>Hello [first name],</p>
<p>Please verify your email address to access your FinSyndeo account: <a href="[verification link]">[verification link]</a>.</p>
<p>This link expires at [expiry]. If you did not request this account, you can ignore this message.</p>`,

  E02: `<p>Hello [first name],</p>
<p>Your request for [service] has been saved under reference [case reference]. You can review your answers and available next steps in your account: <a href="[secure case link]">[secure case link]</a>.</p>
<p>No financial institution has approved your application at this stage.</p>`,

  E03: `<p>Hello [first name],</p>
<p>Please clarify the following information so we can continue assessing your request:</p>
<p>[Specific questions tied to the applicant declaration]</p>
<p>Please update your application securely here: <a href="[case task link]">[case task link]</a>. Avoid sending sensitive identity information by ordinary email.</p>`,

  E04: `<p>Hello [first name],</p>
<p>Potential options are available for your [service] request. Sign in to compare how they meet your essential requirements and preferences: <a href="[results link]">[results link]</a>.</p>
<p>A potential match is not an offer, account approval or guarantee of acceptance. You choose whether to request an introduction.</p>`,

  E05: `<p>Hello [first name],</p>
<p>We have not identified a provider in our current network that supports the requirements declared in your application. You can review your preferences or enable alerts for future suitable providers here: <a href="[case link]">[case link]</a>.</p>
<p>This is not a rejection by a financial institution.</p>`,

  E06: `<p>Hello [first name],</p>
<p>[status paragraph]</p>
<p>You can correct your information or request an eligibility review here: <a href="[secure link]">[secure link]</a>.</p>`,

  E07: `<p>Hello [first name],</p>
<p>[Introducer name] has submitted a [service] request on behalf of [applicant name]. Please sign in using your own verified account to review the information, confirm the authority and approve or correct the request: <a href="[single-use claim link]">[single-use claim link]</a>.</p>
<p>No introduction will be arranged until the required confirmations and checks are complete. If you did not authorise the submission, please report it through [secure support route].</p>`,

  E08: `<p>Hello [first name],</p>
<p>You requested an introduction to [institution legal name] for [service]. Please review the client profile, recipient details and institution privacy notice, then confirm the information you authorise us to share: <a href="[secure confirmation link]">[secure confirmation link]</a>.</p>
<p>Any applicable introduction charge will be shown before payment. Your request remains subject to current pre-introduction checks and the institution's own assessment.</p>`,

  E09: `<p>Dear [banker first name],</p>
<p>I am pleased to introduce [applicant name], [represented by authorised contact name and role, for an entity], regarding [concise requested service].</p>
<p>Based on the information provided and our preliminary review, the request appears relevant to [institution legal name]'s declared services and acceptance criteria. This introduction is subject to your institution's own eligibility, compliance and onboarding assessment.</p>
<p><strong>Client overview</strong></p>
<ul>
<li>Applicant: [applicant name]</li>
<li>Incorporation or residence: [country appropriate to route]</li>
<li>Business activity or professional background: [applicant-confirmed summary]</li>
<li>Requirement: [essential services and currencies]</li>
<li>Relevant amounts: [relevant amounts summary]</li>
</ul>
<p>[profile delivery method]</p>
<p>[Applicant contact first name], [banker name and title] is the designated contact at [institution legal name] for this request. I have copied you both so you can continue the discussion directly.</p>
<p>The profile records preliminary information and does not represent completion of the institution's KYC or a commitment to accept the client.</p>
<p>Kind regards,<br>[Approved SOPHIMA sender name and title]<br>[Verified SOPHIMA contracting entity] | FinSyndeo</p>`,

  E10: `<p>Hello [first name],</p>
<p>Your authorised introduction has been sent to [banker name and institution] for [service]. You can view the introduction status in your account: <a href="[secure case link]">[secure case link]</a>.</p>
<p>The institution will contact you directly and apply its own assessment and onboarding procedures.</p>`,

  E11: `<p>Hello [first name],</p>
<p>We received [amount and currency] for [specified introduction entitlement]. Reference: [payment reference]. Your receipt and current request status are available here: <a href="[secure link]">[secure link]</a>.</p>
<p>Payment does not guarantee institution acceptance or override pre-introduction checks. The terms and any refund/credit outcome shown at checkout apply.</p>`,

  E12: `<p>Hello [first name],</p>
<p>A newly available provider meets all your current essential requirements and your chosen fit threshold for [case reference]. You can review the updated anonymous options here: <a href="[secure results link]">[secure results link]</a>.</p>
<p>Potential matches remain subject to current checks and the provider's own assessment. You can change your threshold or turn off alerts in your account: <a href="[preferences link]">[preferences link]</a>.</p>`,

  E13: `<p>Dear [provider contact name],</p>
<p>Please complete your institution's services and client acceptance criteria through this secure invitation: <a href="[invitation link]">[invitation link]</a>. You can upload internal policies to help SOPHIMA assess suitable prospects.</p>
<p>Documents remain for SOPHIMA's authorised internal use. Listing requires verified authorisation, an approved profile and a current referral agreement. Your institution's name remains hidden in applicant shortlists until the approved introduction process.</p>`,

  E14: `<p>Dear [contact name],</p>
<p>[provider status paragraph]</p>
<p>Please review it here: <a href="[secure profile link]">[secure profile link]</a>. Updates to acceptance criteria require the applicable review before they affect matching.</p>`,

  E15: `<p>Dear [contact name],</p>
<p>Your authorised [report type] covering [period] is available here: <a href="[secure report link]">[secure report link]</a>. The report includes only the permitted fields for your institution.</p>`,

  E16: `<p>Dear [provider contact name],</p>
<p>Please provide the agreed analytical commission report for [period], identifying the relevant client and provider relationship for each commission entry, with the agreed currency, net commission, applicable tax breakdown and receipt reference.</p>
<p>Include the stable statement-line reference, commission amount and its gross/net definition, VAT treatment, any withholding or directly attributable charges and provider payment reference where available. SOPHIMA separately reconciles actual cash received; the report is not itself proof of bank settlement.</p>
<p>Submit it through <a href="[secure portal link]">[secure portal link]</a>. This request is distinct from FinSyndeo's outgoing case reports.</p>
<p>Kind regards,<br>[Approved SOPHIMA sender]</p>`,

  E17: `<p>Dear [introducer contact name],</p>
<p>SOPHIMA has invited you to review the Introducer Agreement and your commission schedule through <a href="[secure invitation link]">[secure invitation link]</a>. Your schedule is [standard tier schedule / agreed bespoke schedule], version [version].</p>
<p>Please review and accept using your own verified account. Your referral link provides attribution only and is not a login credential.</p>`,

  E18: `<p>Dear [contact name],</p>
<p>Your applicable commission rate is [rate]% from [effective date], under [agreement/schedule version and reason suitable for recipient]. The rate applies to [precise agreed scope and calculation basis]. Posted historical entries retain their original terms unless a documented correction is required.</p>
<p>Review the schedule and any required acceptance here: <a href="[secure link]">[secure link]</a>.</p>`,

  E19: `<p>Dear [contact name],</p>
<p>Your commission statement has been updated. Sign in to review the entries available for invoicing under your agreement and upload your invoice securely here: <a href="[ledger link]">[ledger link]</a>.</p>`,

  E20: `<p>Dear [contact name],</p>
<p>Your invoice is [received / clarification required / approved / partially paid / paid]. Please review the actual amounts, payment status and any required action in your secure account. [Specific nonsensitive clarification, if needed.]</p>
<p>Supporting status information is available here: <a href="[secure invoice link]">[secure invoice link]</a>.</p>`,

  E21: `<p>Hello [first name],</p>
<p>We have received your request to [close the account / delete personal information / withdraw an application]. [Immediate effects already performed, such as alerts stopped.]</p>
<p>We will review the request and respond within the applicable data-protection timeframe. If information must be retained under a lawful exception, we will explain the categories, reason and retention period.</p>
<p>Expected response date: [calculated due date]. If a lawful extension is needed, we will inform you within the applicable period and explain the reason.</p>`,

  E22: `<p>[Feed stale / unresolved screening match / unclear authority / missing provider contact / payment mismatch / provider-policy conflict / delivery failure]</p>
<p>Review the restricted task here: <a href="[authenticated Admin link]">[authenticated Admin link]</a>.</p>`,
};
