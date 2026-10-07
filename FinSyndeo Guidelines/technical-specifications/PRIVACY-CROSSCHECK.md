# FinSyndeo independent privacy crosscheck

6 October 2026. Read-only review of `PRIVACY-REGULATORY-REVIEW.md` and `CLIENT-PROFILES-AND-DD-DRAFT.md`. No prototype, existing report or policy changed.

Working premise supplied by the user: SOPHIMA provides introductions only and is not a financial service provider or AML obliged entity. This review accepts that business description for product design; it does not certify the legal classification. The existing drafts are broadly careful. The main correction is to turn their open legal questions into specific scope limits and launch conditions, without importing a bank's AML duties into an introducer's workflow.

## Concrete corrections

### 1. State the introducer premise and choose bases per purpose and person

For this design, do not assign compulsory AML KYC, PEP checks, suspicious-activity reporting or five-year AML dossier retention to SOPHIMA. A provider contract or commercial acceptance rule is not an Article 6(1)(c) legal obligation imposed on SOPHIMA. Identify any actual law separately. The EDPB distinguishes statutory duties from contract and legitimate interests. [EDPB lawful bases](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en).

Add a purpose/person matrix before launch: individual applicant service; company contact/representative; UBO/director; optional individual counterparty; proportionate risk screening; requested institution disclosure; alerts; commissions/accounting. Article 6(1)(b) can cover objectively necessary service processing where that individual is the contracting party or requests the precontractual steps. A company's contract does not automatically supply that basis for its director or UBO. A documented legitimate-interest assessment may support ordinary corporate contact or risk data where necessary and balanced; it is not an automatic permission for every check. These are proposed candidates, not a final basis allocation. [EDPB contractual-necessity guidance](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines-art_6-1-b-adopted_after_public_consultation_en.pdf).

### 2. Give third-party people a notice workflow

The current representative-authority checkbox is useful but cannot replace notice to another person. Record where each person's data came from and whether that person already received the relevant notice. For indirect data, trigger Article 14 information within the applicable reasonable period, no later than one month, and earlier at first communication or first disclosure where applicable. A documented exception needs its own justification; public availability or the applicant's statement is not a general exception. The notice must cover source, purposes, bases, recipients, retention and rights. [Commission transparency obligations](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en).

Implementation proposal: give the corporate applicant a suitable third-party notice to circulate, keep evidence of delivery, and provide a direct notice route where delivery cannot be established. Counsel should validate that workflow and any proposed exemption. Do not collect extra private addresses merely to fill a notice field.

### 3. Make Article 10 a collection gate for adverse media

Replace “assess Article 9 and Article 10” with a recorded approval requirement before criminal-offence data is searched, collected, scored, stored or sent to an AI/screening vendor. An Article 6 basis, an applicant checkbox, publicly accessible news or a vendor licence does not itself satisfy Article 10. SOPHIMA needs applicable Union/Member State authorisation with safeguards, or processing under official-authority control. The EDPB has specifically warned about these issues for commercial AML watchlist providers. [EDPB watchlist letter](https://www.edpb.europa.eu/system/files/2022-05/edpb_letter_out2022-0035_aml_cft_proposal_ec_en.pdf), [GDPR Article 10](https://eur-lex.europa.eu/eli/reg/2016/679).

Criminal data is not limited to proven convictions: the CJEU includes judicial investigation and trial information even where the offence is not proved. Do not turn an allegation into a finding. [CJEU C-136/17, paragraph 72](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62017CJ0136).

Pending Cyprus counsel's identified legal route, disable collection of criminal-offence adverse-media dossiers and broad crawling that predictably captures that content; let institutions conduct their own authorised onboarding. Bounded noncriminal business checks can be assessed separately with a documented basis and filters. Manual searching or receiving a third-party dossier is still processing. Ordinary office/PEP facts require their own basis; do not infer political opinions. Filter unrelated health, religion, ethnicity and other Article 9 content unless an additional condition is established. This scope limit is a review recommendation, not a finding that every sanctions or PEP entry is Article 9/10 data.

### 4. Narrow the internal subject ledger

The draft's “all relevant people and entities” and “other interests” map need an explicit necessity test. Do not make worldwide affiliate discovery or all-counterparty individual screening a default. Start with parties needed for the requested introduction and a stated, applicable rule; add subjects only with recorded relevance. Prefer country/exposure aggregates where names are unnecessary. Include enough identifiers to resolve a justified check, avoiding indiscriminate identity-document collection. These limits follow minimisation and privacy by default. [EDPB privacy by default](https://www.edpb.europa.eu/sme/be-compliant/be-compliant_en).

Use “internal pre-introduction assessment” for SOPHIMA's report. “Suspicious-activity material” should not imply a statutory AML reporting role under the supplied premise. Restricted internal notes still contain personal data and do not create an exemption from privacy duties.

### 5. Keep sharing authority distinct from GDPR consent

Keep the institution-specific, profile-version-specific approval. State whether it is an instruction to perform the requested service or consent relied on as the GDPR basis. If using consent, provide a genuine choice, the scope and an easy withdrawal route; record consent from the relevant person rather than assuming company authority covers every individual. Withdrawal stops future consent-based disclosure; it does not undo lawful past disclosure. [EDPB consent requirements](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en).

Complete the role and transfer review for each institution/vendor. Independent-controller institutions determine their own onboarding processing; processors need Article 28 terms. An approval checkbox cannot replace an applicable international-transfer mechanism. [EDPB roles and contractual responsibilities](https://www.edpb.europa.eu/sme/learn-the-basics/data-controller-or-data-processor_en).

### 6. Complete deletion and retention controls

Keep the draft's 90-day/annual settings explicitly labelled proposed design periods. Under the working premise, remove five-year AML retention as a default. Confirm Cyprus accounting/tax periods and a narrowly justified claims period separately. A continuing commission relationship supports only necessary attribution/accounting records; it does not justify retaining the complete profile or screening dossier. [EDPB storage limitation](https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en).

Add notification to recipients when rectification, erasure or restriction is required, subject to the applicable impossible/disproportionate-effort exception. The current statement that institution copies are not automatically deleted is correct, but should not imply SOPHIMA has no notification duty. Keep separate controls for account closure, withdrawal, consent withdrawal and a rights request. Explain the retained categories, basis and expiry; restricted access is not necessarily formal Article 18 restriction. [EDPB erasure and restriction guidance](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en).

### 7. Add the EU AML list as a separate country axis

Use separate versioned results for applicable sanctions; FATF increased-monitoring/call-for-action status; EU AML high-risk third-country status; SOPHIMA policy; and provider acceptance. FATF increased monitoring does not itself direct blanket refusal or enhanced due diligence. [FATF 19 June 2026 statement](https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions/increased-monitoring-june-2026.html). The EU AML list is separately maintained and can differ; its obligations do not automatically become SOPHIMA's duties under the working premise. [Commission EU high-risk-country list](https://finance.ec.europa.eu/financial-crime/anti-money-laundering-and-countering-financing-terrorism-international-level_en).

The draft correctly distinguishes unresolved matches from confirmed restrictions and refuses to copy OFAC ownership rules across regimes. Its UK source change is also correct: OFSI's old list closed on 28 January 2026. Use applicable legislation and nexus, ownership/control and service restrictions in addition to names. [UK list closure notice](https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets/consolidated-list-of-targets), [OFAC rule](https://ofac.treasury.gov/faqs/401).

### 8. Turn automated-decision review into an actual safeguard

Do not certify either that Article 22 always applies or that introduction decisions can never be significant. Review actual effects, particularly individual financing/private-banking exclusion. Where a significant decision is solely automated, a lawful Article 22 route and safeguards are needed; an appeal button alone does not provide that route. For the proposed design, route possible screening hits and consequential exclusions to a competent reviewer who can assess evidence and change the outcome. [Commission automated-decision explanation](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en), [EDPS meaningful human oversight](https://www.edps.europa.eu/data-protection/our-work/publications/techdispatch/2025-09-23-techdispatch-22025-human-oversight-automated-making_en).

Keep the clear first-interaction AI disclosure. Article 50 applies from 2 August 2026, but provider/deployer responsibilities and exceptions depend on the actual system. A notice is not complete AI Act compliance. Assess the delivered use and current law; do not infer high-risk classification solely from financial context. [Commission Article 50 guidance](https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations), [current Article 50 text](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50).

## Cyprus counsel decisions and limits

Obtain a proportionate written review of the actual introduction activities/regulatory perimeter; the bases/legitimate-interest assessments; any Article 9/10 authorising route and safeguards; third-party notices; actual retention statutes; sanctions nexus/service restrictions; international transfers; and automated exclusion/AI classification. Reassess before adding advice, credit arranging or another regulated activity.

The official Cyprus Commissioner's Law 125(I)/2018 page and English PDF were discoverable but returned access restrictions during direct retrieval; no conclusion about a Cyprus Article 10 permission is made from that incomplete retrieval. [Official Cyprus law page](https://www.gov.cy/dataprotection/documents/archiki-selida-nomothesia-nomos-125i-2018/).

This is a product/privacy audit crosscheck, not legal clearance or a guarantee against complaints, disputes or enforcement. Sources were checked on the review date; lists, legislation and provider rules require controlled updating.
