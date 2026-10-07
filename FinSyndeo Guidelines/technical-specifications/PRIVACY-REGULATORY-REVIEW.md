# FinSyndeo data protection and regulatory review

Review date: 6 October 2026. Status: proposals for Marios approval and qualified legal validation. No prototype or production policy is changed by this review.

## Conclusions for this product

Marios has confirmed that SOPHIMA acts **solely as an introducer**. The design therefore does not assign compulsory bank-style AML KYC or five-year AML dossier retention to SOPHIMA by default. The actual activities and legal perimeter still require professional confirmation; adding investment advice or credit arranging could change that assessment.

A blanket consent checkbox is not a substitute for a purpose-specific lawful basis. Account operation, individual service requests, corporate representative information, screening, optional alerts and disclosure to an institution must be analysed separately. A representative cannot provide GDPR consent for all other individuals merely by checking an authority box. Keep service authority, declaration accuracy, privacy acknowledgement and optional consent as distinct records. The EDPB explains that contractual necessity covers objectively necessary processing, rather than everything mentioned in terms. [EDPB lawful processing](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en).

Erasure is a right with exceptions, rather than an unconditional promise to erase all records after introduction. Provide account closure, application withdrawal and a personal-data erasure request. Respond without undue delay, normally within one month; apply any lawful extension properly. Explain retained categories, reason and duration. [European Commission individual rights](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en).

Retention must be purpose-based, limited and disclosed. Do not keep every questionnaire forever because commissions may continue. Retain only the minimal referral identity, relationship and accounting evidence needed for the continuing purpose. Keep sensitive screening records separate from the active matching profile. [European Commission storage limitation](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en?prefLang=hu).

Cyprus AML Law section 68 specifies at least five years for the records of covered persons, measured after the transaction or end of the business relationship. This does NOT establish that SOPHIMA, simply because it introduces clients, is automatically subject to that duty. Confirm its activities, status, regulator and applicable amendments with its adviser before assigning this retention rule. [Cyprus AML Law section 68 reproduced by the Cyprus Bar legal database](https://www.cylaw.org/nomoi/enop/ind/2007_1_188/section-sc9464339a-9e68-094c-010e-e460298ebd55-ln9c226d20-5b51-7794-a98e-62870a8843ea.html).

Country declarations must remain truthful. FATF increased monitoring is distinct from sanctions and does not itself call for cutting off whole classes of customers. Use current law, SOPHIMA policy and each provider's policy as separate decisions. [FATF June 2026 increased monitoring statement](https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions/increased-monitoring-june-2026.html).

A consolidated name list does not capture every restriction. Applicable measures, identity resolution and ownership/control must be maintained too. OFAC's rule uses aggregated direct/indirect blocked-person ownership; that logic must not be copied mechanically to every other regime. [OFAC ownership guidance](https://ofac.treasury.gov/faqs/401). The current UK designation source is the UK Sanctions List; the OFSI consolidated list stopped updating on 28 January 2026. [UK official sanctions collection](https://www.gov.uk/government/collections/uk-sanctions).

Assess whether automated exclusion or scoring has a legal or similarly significant effect and whether GDPR Article 22 applies; do not assume that calling a service an introducer removes this question. A real challenge and human-review channel is needed where applicable. An AI interface must be clearly disclosed; EU AI Act Article 50 transparency obligations apply from 2 August 2026. [Commission AI transparency guidance](https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations).

SOPHIMA, institutions, introducers, hosting, AI and screening vendors require a documented role analysis. Contracts and transfer arrangements follow their actual roles. [EDPB controller and processor guidance](https://www.edpb.europa.eu/sme/learn-the-basics/data-controller-or-data-processor_en). Applicant declarations may contain personal information about UBOs, directors and counterparties obtained indirectly; implement applicable Article 14 notices and documented exceptions, rather than ignoring those people. [Commission transparency obligations](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en).

## Proposed interface wording

Start screen acknowledgement:

> I have read the Privacy Notice explaining how SOPHIMA uses my information for assessment, matching and pre-introduction checks.

Show a real linked notice before submission. The acknowledgement is not presented as the lawful basis for every processing purpose.

Accuracy confirmation:

> I confirm that the information provided is accurate to the best of my knowledge and that I will notify SOPHIMA of material changes.

Representative authority:

> I confirm that I am authorised to provide this information and submit this request on behalf of the applicant. I can provide evidence of that authority if requested. I understand that the applicant may be asked to confirm the submission before an introduction is arranged.

Selected-institution sharing confirmation:

> I authorise SOPHIMA to introduce [applicant name] to [institution legal name] and share the client profile shown below, version [version], for assessment of [requested service]. I understand that the institution will apply its own eligibility and onboarding checks and will process information under its own privacy notice.

Show the actual institution, privacy notice, recipient role and exact profile contents before this confirmation. No hidden institution selection or automatic approval by an introducer. Record the person, authority, scope, version and time. An applicant cannot authorise the unlawful disclosure of another person's data; complete the lawful-basis/notice review independently.

Future-match alerts, unchecked by default:

> Notify me when a new provider meets all my essential requirements and my selected fit threshold. I can switch this off at any time.

Use a separate marketing choice if broader promotional emails are proposed. Service and account notifications are separate from advertising.

Voice-intake notice:

> You are speaking with an AI intake assistant. It helps prepare your answers and does not approve applications or make the institution's decision. You can switch to the questionnaire at any time. Please review and correct the information before submitting.

Before microphone access explain the processor, purpose, data sent and actual retention. Browser permission is not the entire GDPR consent/basis process. Persistent audio storage, if introduced, requires its own justified purpose and notice.

Account controls:

- Download my information.
- Withdraw this application.
- Turn off match alerts.
- Close my account and request deletion of my personal information.
- Correct information or request review of an eligibility decision.

Deletion confirmation:

> Closing your account stops future match alerts and new introductions. We will delete information that is no longer needed. Where records must be retained for an applicable legal obligation or a justified legal-claims purpose, we will restrict their use and tell you which categories are retained, why and for how long. Closing your FinSyndeo account does not automatically delete information already lawfully held by an institution you were introduced to.

Eligibility message for SOPHIMA policy exclusion:

> Based on the information provided, your application falls outside FinSyndeo's current eligibility criteria. We cannot offer provider matching or arrange an introduction for the requested service at this time. If information is incorrect or you wish to request a review, please use the options below.

Provider-coverage message, only when verified:

> We have not identified a provider in our current network that supports the requirements declared in this application. This is not a decision by a financial institution. You can review your preferences or request notification of future suitable providers.

Never say that all providers cannot serve a client unless the verified provider records establish this. Do not expose sensitive screening reasons or label a possible name match as a sanctioned person.

## Proposed retention schedule for approval

These are design defaults, NOT statutory periods. Final numbers need the legal-status, contract and purpose review.

| Record | Suggested product rule | Exception and deletion treatment |
|---|---|---|
| Unsubmitted draft | Delete after 90 days of inactivity following a warning | Do not silently refresh the clock merely because a background task reads it |
| Active assessment | Keep while needed for the requested matching/introduction service | Material revisions need applicant confirmation; withdraw disables new introductions |
| Closed or abandoned prospect | Review 90 days after closure; purge unnecessary profile detail | Retain only a justified and disclosed minimum for claims, anti-fraud or an actual legal duty |
| Profile with active future-provider alerts | Annual reconfirmation; pause on stale information and expire without renewal | Opt-out stops alerts immediately; does not invent a need for indefinite full-file storage |
| Raw voice audio | No persistent storage by default; transient processing only | If technically buffered, specify and enforce a short purge interval before launch |
| Working transcript | Retain only until the structured answers are confirmed, with a short approved expiry | Do not keep full free-form conversations for model training by default |
| Screening evidence | Restricted purpose-specific schedule | Apply AML period only if SOPHIMA is covered; otherwise justify another limited schedule |
| Referral attribution and continuing relationship | Minimal identity and relationship record while required for agreed commissions | Full KYC/intake content is not needed solely to calculate commission |
| Invoice, payment and tax records | Applicable statutory retention confirmed by accountant and lawyer | Account closure does not remove a legal accounting duty |
| Sharing/consent and decision evidence | Only what is necessary to establish authority and lawful decisions | Access controls, expiry and lawful claims holds; no unlimited audit exemption |
| Provider policies and agreements | Current version plus justified historical evidence | Not exposed to applicants; personal contact data also has a retention basis |
| Backups and vendor copies | Defined bounded expiry and deletion propagation | Restore must reapply erasure tombstones; no indefinite recoverable deleted profiles |

## Implementation controls

Create a retention register with purpose, basis, category, trigger, duration, hold reason, owner and deletion job. Erasure must reach database rows, file storage, search indexes, embeddings, caches, AI/transcription vendors and queued emails. Suspend matching/alerts and invalidate access tokens when account closure begins. Preserve only approved minimal records under restricted access; record what was deleted versus retained. Do not claim cryptographic pseudonymisation is deletion where data can be reidentified.

Maintain a record of processing activities; assess the need for a DPIA given screening, profiling, financial information, AI and automated exclusions. Document security, incident response and applicable breach reporting. Assess Article 9 and Article 10 conditions before storing sensitive or criminal-offence information from screening/media. Public availability alone does not establish unrestricted lawful reuse.

**Specific launch gate:** identify and record the applicable Article 10 authorising law and safeguards before activating criminal-offence adverse-media searches, collection, scoring, storage or vendor processing. Consent, public news and a screening subscription alone are insufficient. Pending that decision, disable broad criminal-allegation dossiers rather than treating an Admin checkbox as permission. Proportionate noncriminal business checks can be assessed separately. [EDPB commercial watchlist letter](https://www.edpb.europa.eu/system/files/2022-05/edpb_letter_out2022-0035_aml_cft_proposal_ec_en.pdf).

**Indirect-data workflow:** record source and notice status for UBOs, directors and individual counterparties. Deliver applicable Article 14 information within the relevant period, no later than one month and earlier at first communication/disclosure where applicable, unless a documented lawful exception applies. A company's service contract does not automatically provide an Article 6(1)(b) basis for another individual's data. Record a proportionate basis/necessity assessment instead. Notify relevant recipients of correction, erasure or restriction where required, subject to applicable exceptions. [Commission transparency obligations](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en), [EDPB rights guidance](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en).

Treat the EU AML high-risk third-country list as a separate versioned signal from FATF and sanctions. Its existence does not impose a bank's AML duties on SOPHIMA under the working premise. [Commission high-risk-country information](https://finance.ec.europa.eu/financial-crime/anti-money-laundering-and-countering-financing-terrorism-international-level_en).

## Purpose and person matrix to complete before launch

| Operation | People concerned | Candidate basis / approval question | Scope limit |
|---|---|---|---|
| Requested individual matching service | Individual applicant | Objectively necessary contract/precontract steps where that individual is the party | Only relevant intake facts |
| Corporate application administration | Representative/contact | Documented ordinary-data basis, potentially legitimate interests after assessment | Company contract is not automatically their personal contract |
| Ownership/control and relevant screening | UBOs, directors, control persons | Separate ordinary-data basis/necessity assessment; additional Article 9/10 conditions where relevant | No unlimited affiliate discovery |
| Selected institution disclosure | Applicant and relevant people in authorised profile | Applicant instruction plus a lawful basis for each person's data and transfer arrangements | Exact recipient, purpose and revision |
| Optional future-provider alerts | Account holder | Separate voluntary subscription/basis and communications-law review | Recheck opt-out and confirmed current facts at send time |
| Referral commissions and accounting | Introducer, authorised contacts, minimal client identity | Contractual/statutory basis only where actually applicable | No full prospect dossier retained solely for commission |
| Voice assistance | Speaker and any mentioned persons | Documented service-processing basis; transparent vendor and retention | No persistent audio by default, no training reuse by default |

These are design candidates, not a completed legal-basis register. The final choice depends on the actual contract, people, purpose and applicable law.

Do not assume every financial institution is an LTD, every PLC is stock-exchange listed, or every regulatory reference is a licence. FINTRAC registration is not a licence or endorsement. Bank of Canada registration depends on the actual RPAA scope. MiCA permission is verified against the relevant authorised entity and services. [FINTRAC register](https://fintrac-canafe.canada.ca/msb-esm/reg-eng?wbdisable=true), [Bank of Canada criteria](https://www.bankofcanada.ca/2026/06/criteria-for-registering-payment-service-providers/), [ESMA MiCA register](https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica).

## Legal decisions that must be confirmed before launch

1. SOPHIMA's precise business and regulatory perimeter, including any arranging, investment or credit-intermediation activity.
2. Controller identity, privacy contact and whether DPO designation is required.
3. Lawful basis and special-category/offence-data conditions for each operation.
4. Retention requirements under the actual AML, accounting and claims rules applicable to SOPHIMA.
5. Applicable sanctions nexus and jurisdiction-specific rule interpretation; policy exclusions separately approved.
6. AI classification and automated-decision safeguards for the delivered functionality.
7. Vendors, processing locations, contractual terms and lawful international transfers.
8. Electronic communications/cookies and marketing permissions under applicable national rules.
9. Final agreements, VAT/tax treatment, liability, termination and dispute clauses.

Approval of a prototype design is not legal approval of those matters.
