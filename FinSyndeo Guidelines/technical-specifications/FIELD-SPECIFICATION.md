# FinSyndeo — Field and wording proposals

6 October 2026 · Changes approved by Marios; consolidated delivery 7 October 2026. Read alongside the 137-row matching coverage matrix and current browser field inventory.

Each substantive field must have a stable schema identifier, a stated purpose, route applicability, client/server validation, summary/export behaviour and a reciprocal provider criterion where it affects matching. Do not turn every provider possibility into a mandatory applicant question: ask further detail only when relevant to the selected service or a conditional result.

## Shared applicant start and entity profile

| Approved wording | Requiredness / behaviour | Review reason |
|---|---|---|
| I am an individual / I represent a legal entity / I represent a financial institution | Visible single-choice applicant cards; no default | Clear route selection; FI is an applicant category, not automatically a legal form |
| What do you need? | Bank account / Merchant account / Bank and merchant accounts / Financing under legal entity; Private banking under individual; Correspondent or payment accounts under FI | The same catalogue must be used by guided intake and provider product setup |
| Registered entity name | Required, jurisdiction-aware validation | Do not impose an arbitrary minimum name length; official verification status separate |
| Country / jurisdiction of incorporation | Required canonical selection; IP suggestion only, never automatic truth | Location of login/VPN is not incorporation |
| Registration number or official identifier | Required where issued; documented exception/clarification where not applicable | No universal format across jurisdictions and legal forms; never accept fabricated placeholder values |
| Legal entity type | Required or registry-derived then confirmed; conditional confirmation for FI | Do not silently set all institutions to LTD; avoid asking twice when a reliable registry supplies it |

## Business activity

| Approved wording | Requiredness / behaviour | Matching / review |
|---|---|---|
| Company website | Optional URL; no implied authenticity claim | Permitted public-source observations compared with declared activities; unavailable is Not checked |
| Industry category | Searchable single primary category; optional secondary category if needed; Other requires description | Shared versioned industry catalogue includes adult industry |
| Please describe your business activity | Required meaningful answer with short guidance: What do you provide, and who are your customers? | No hard 30-character rule as a proxy for quality |
| Does this activity require a licence, authorisation or registration? | No preselected answer; regulated sectors trigger applicability/permission clarification | Distinguish gambling/betting from ordinary video-game development; distinguish broker/CFD activity from nonregulated consulting |
| Permission number; issuing authority; holder | Required for each claimed relevant permission | Licence/registration type, scope and jurisdiction conditionally required when not inferable; verify current official status |
| Does the entity have physical offices in its country of incorporation? | Required Yes / No; concise description only if needed | Distinguish staffed operational premises from a registered/mailing address |
| Employees excluding directors | 0 / 1–5 / 6–25 / over 25 | Provider predicate asks whether at least one nondirector employee is mandatory |
| EU subsidiary acting as payment agent | Show only for relevant non-EU applicant/product situation | No assumption that a subsidiary or parent licence permits the proposed activity; separate identities, authority and eligibility |

## Bank purpose and flows

| Approved wording | Requiredness / behaviour | Matching / review |
|---|---|---|
| Why do you need this account? | Multi-select operational receipts/payments, diversification, reserve, better service/rates, specific facility, Other | Specific facility opens only relevant choices; Other needs concise clarification |
| Which facilities do you require? | Conditional escrow, trade finance, payroll, cards, FX, fixed-term deposit/investment need; each Essential / Preferred | A single currency does not prove FX unnecessary; capabilities need provider equivalents and appropriate regulatory scope |
| Required currencies | EUR  / GBP  / USD  / CHF  / Other checkboxes where relevant; Other canonical ISO codes | Mark essential versus preferred rather than silently excluding all for optional currency |
| Reporting currency | One currency for monthly totals | Amounts cover all chosen account currencies; preserve explicit unit |
| Incoming / outgoing countries | Canonical multi-select; EU shortcut at top expands members | Shortcut only for transfers, never nationality/residence/tax; do not use for merchant allocation |
| Expected transfers per month; total monthly amount | Separate numeric estimates per direction | Zero permitted if genuinely no activity; validate integer counts and currency precision, not arbitrary bands |
| Main counterparties, if known | Optional Add counterparty per direction: legal name, entity/person, country, relationship | Each relevant supplied name becomes an identifiable subject; do not request all retail customers |
| Does the entity currently hold a bank account? | Yes  / No  / Prefer not to answer; optional | Conditional bank name and country; collect once here or applicable route needs, not on Contact |

## Merchant questions

Shared entity, activity, ownership and contact remain once. Bank-only never opens these questions.

| Approved wording | Requiredness / behaviour | Matching / review |
|---|---|---|
| How will you accept card payments? | Online  / In person POS  / Both | Acquiring can cover both; do not describe it as online only |
| What do you sell and how is it delivered? | Reuse activity; targeted delivery/recurring/marketplace clarification where relevant | Avoid asking for the same activity again |
| Expected card-origin countries and shares | Countries grouped for navigation; percentages total 100%; define basis as payment value | Countries are matching inputs, regions merely selection assistance |
| Monthly processing amount and successful payments; average/max typical ticket | Mandatory meaningful estimates where essential; one reporting currency | Show apparent inconsistency for correction rather than silently manufacture volume |
| Available processing history | None / number of months; new business option | Do not assert every provider requires exactly six months |
| Chargeback ratio; fraud ratio | Visible optional percentages with concise help | Blank means unknown; definitions and period clarified later only when necessary |
| Target blended processing price | Optional, good to know | Preference; no guaranteed risk-based price |
| Alternative payment methods required | Optional specify which methods; Essential  / Preferred | Remove fee-per-transaction and long generic additional-payment-method block |
| Crypto-related requirements | Optional closed section | Conditional assets/chains/service scope; lawful/provider requirements distinct |
| Do you have a bank account for settlement? | Yes  / No | Settlement bank/country/currency as relevant; do not ask for account number initially |
| Would you also like a bank account? | Merchant-only + no settlement account, or explicit additional need | Yes activates missing bank questions, preserving common answers; absent on already combined route |

## Financing

Collect identity/activity/ownership/contact once. Financing facility and use, amount/currency, project stage and country, desired timing, existing financing and relevant assets/guarantees are separate facts. **Requested repayment term, if known** means how long the borrower expects to repay; show only for a facility where that question makes sense and keep optional if provider matching can be conditional.

Use **Latest audited financial statements — financial year**, with No audited statements / Not yet available as truthful alternatives. Do not require irrelevant period-start/end or invented profit/loss numbers. This is a declaration of availability, not proof that statements were uploaded/reviewed. Where a provider requires revenue/financial ratios, request a targeted additional fact or mark that result provisional. Remove UBO personal-account cross-selling on financing.

## Private banking

Page 1 begins with **Name** and **Surname**, then canonical nationalities, residence and tax-residence countries. Selected countries remain visible when the picker closes. A TIN country is distinct from a TIN number; do not require tax identifiers in this preliminary stage without a justified reason.

Page 2: requested service → approximate liquid assets → amount expected to place → relevant currencies and optional relationship-manager language. Use nonoverlapping EUR bands 50,000–under 100,000  / 100,000–under 500,000  / 500,000–under 1 million  / 1 million–5 million  / over 5 million, plus a truthful below 50,000 route if the service needs to explain no current coverage. Do not silently exclude above 10 million or assume 50,000 meets every institution's minimum.

Provider deposit and investment minima are different criteria. If a liquid-asset band straddles a threshold, ask only the needed clarification. Remove desired bank country and When would you like to start. LinkedIn is optional and not identity proof. Keep short source-of-wealth categories and initial source-of-funds facts where necessary; remove a long general wealth narrative. Additional evidence belongs to a justified later-stage request. Optional named counterparties can be supplied for regular transfer directions.

## Correspondent/payment account applicant

| Approved wording | Requiredness / behaviour | Review |
|---|---|---|
| Institution type | One primary choice, including EMI  / PSP  / MSB  / CASP  / bank  / other | Other registrations captured separately; type does not establish authorisation |
| Regulator / registering authority; permission number; permitted services | Required relevant facts; no 30-character minimum for a short activity list | FINTRAC registration is not a licence; authority jurisdiction needed only if genuinely missing |
| MSB registration country | Required if MSB | Canada opens configured provider-policy questions; not universal Canadian law |
| Underlying client types, sectors and main regions | Relevant required choices; country clarification if policy needs it | Region-only cannot establish absence of prohibited country exposure |
| Accounts and connectivity required | Own operational account explicitly required under current design; dedicated client-funds account, dedicated/virtual IBANs and API as needed | Define dedicated account versus virtual identifiers; do not imply all services are interchangeable |
| Operational incoming/outgoing; client-funds incoming/outgoing | Separate scope and numeric/country fields | Own money and clients' money must not be merged |
| MLRO arrangement | Internal  / External  / Not appointed; internal location conditional | No irrelevant compliance-contact name/email in preliminary intake; provider policy governs eligibility |
| CASP/MiCA and crypto controls | Conditional actual authorisation status and service scope; applicable assets/chains/controls | Do not force EU authorisation on every global operator without applicability; Travel Rule and blockchain screening require explanation |

Do not require a UBO personal-account opportunity on this route. Canadian requirements concerning offices, local personnel, capital, Bank of Canada status and user interfaces are provider acceptance conditions when configured; they are not declared to be blanket law for all MSBs.

## Ownership & control, contact and final summary

Use one person record with name, role(s), nationality/nationalities, residence and relevant ownership/control facts. Do not force a positive percentage on a trustee, governing officer or control-only person. Reuse the record across director/UBO roles and screen once with all roles visible. Names are needed for justified pre-introduction screening; further identifiers are conditional for disambiguation.

Corporate shareholders need registered name, incorporation and official identifier where available. Group name is conditional Yes; a group brand is not an identified legal entity. Foundation/association/partnership controls use structured roles rather than repeating lists in free text. Listed PLC treatment needs verified exchange/issuer/disclosure applicability, not the letters PLC alone.

Contact: name/surname → email → relationship/capacity to applicant → authority declaration. External lawyer/accountant/introducer must state their capacity; applicant confirmation may be required. Validate email syntax plus verify the account/contact; syntax alone proves no ownership of that address.

Last screen: **Your Assessment Summary** with section Edit links, accuracy/authority acknowledgement and Confirm to find potential providers. Existing banking is earlier. Later introduction approval shows actual recipient, exact external profile revision and sharing scope. Routine data processing notice, optional alerts and introduction instruction remain distinct.

## Provider field counterparts

Products are delivered by the stated approved institution. Use **Our accounts support** / **Private banking requirements** / **Financing facilities offered**, rather than ambiguous service headings. Published benefits can appear in approved anonymous summaries; internal policy documents and original uploads never do.

For each product, require applicable currencies, rails (SEPA, instant SEPA, SWIFT, Faster Payments, ACH/ABA as correctly defined, TARGET or other supported capability), dedicated IBAN Yes / No and actual IBAN issuing countries. Distinguish an ABA routing identifier from a payment network. Onboarding options should separate remote method, video/online identification, video interview, in-person and physical/legalised documents.

Eligibility includes entity forms, supported/prohibited/conditional countries by axis, industries including adult, startup/no-history treatment, physical-office and nondirector employee policy, licence scope, thresholds, underlying clients and flow limits. Upload accepted/prohibited lists or use controls; blanks and Not confirmed do not mean support. Private deposit versus invested minimum are separate. Non-EU licensed parents/payment-agent subsidiaries need an explicit policy, not an implied workaround.

Availability remains Admin-controlled under the agreed model. Providers can sign in and amend their profile; proposed amendments have a review/publication lifecycle. Analytical commission reporting per client, period choices and ad hoc capability govern introducer participation. Referral agreement and restricted documents remain separate from applicant fee settings. No fixed product-pricing tab is reintroduced; risk-dependent pricing is a quote/condition, with target price a client preference.
