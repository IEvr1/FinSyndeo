# Applicant form and draft specification

Approved English edition, 7 October 2026. Use the exact field wording reference and the generated field dictionary with these flow and validation rules. All routes share one schema and saved application record. English is the only interface language; remove language selectors rather than displaying disabled future translations.

## Applicant identity and service selection

Display visible applicant cards for Individual, Legal entity and Financial institution. For legal entities display Bank account, Merchant account, Both bank and merchant accounts, and Financing. Do not require opening a dropdown to understand who can apply. Private individuals seek private banking. Financial institutions seek correspondent/payment facilities and select one institution type. Do not assume every financial institution has the same legal form; a registry-derived legal form may be confirmed where needed.

Company registration number or official identifier is required where issued. Legal forms without such an identifier need a documented exception/clarification, not a fabricated value. The company country is canonical. An IP-based suggestion is only a convenience, never the incorporation/residence fact. No country disappears merely because it is sanctioned or high-risk; truthful entry triggers the applicable policy/check state.

## Validation and navigation

Forward movement checks visible, applicable required fields and shows the exact reason for stopping near the field and in an accessible error summary. Backward navigation preserves input. The final summary checks the whole applicable flow, not only the last visible screen. Hidden conditional fields do not block unrelated routes. Meaningful activity/funding descriptions must reject single letters and obvious repeated-character placeholders; a fixed 30-character minimum is not a reliable quality rule. Follow-up clarification, rather than invented text, resolves inadequate content.

Email uses valid address syntax, followed by actual account/contact verification in production. Syntax validation alone does not prove that the mailbox exists or is authorised. The entity contact provides name, email, relationship/capacity and authority confirmation. External lawyers/accountants/introducers require actual authority evidence where needed. Admin cannot manufacture applicant approval by ticking a box.

Monthly counts are nonnegative integers; monetary estimates are nonnegative values in an explicitly selected reporting currency. For zero-activity flows both count and amount must be zero. Positive amounts require positive counts and countries. Do not conflate the account's projected flows with the company's total turnover. Merchant projections have positive card amounts and exact unique country allocations totalling 100. Unknown optional ratios/pricing are blank rather than zero.

## Business activity and licences

Website is optional. Industry offers sufficiently distinct categories, including Adult industry, real-money Gambling/betting, Forex/CFD brokerage, customer crypto-asset services, video games/esports without wagering, and blockchain software without custody/exchange. Other requires a short specification and classification before automatic support.

Ask whether the activity requires permission/licensing; applicable regulated activities must provide the relevant licence/registration reference and issuing authority, with holder/scope/jurisdiction clarification where necessary. A No answer does not exempt an actually regulated activity from review. Do not assume all software games require a gambling licence or that every crypto-related software business is a licensed CASP.

Ask about physical offices in the incorporation country and nondirector staff: 0, 1–5, 6–25, More than 25. Remove the unnecessary Operational presence and team heading. Relevant non-EU merchant/both applicants can declare an EU subsidiary/payment agent; capture its separate identity and provider acceptance without implying that a parent licence automatically covers it.

## Bank and merchant combination

Bank questions cover operational receipts/payments, diversification, reserve/safekeeping and requested facilities such as escrow, trade finance, automated payroll, cards, FX and term deposits where applicable. Facilities and currencies can be marked Required or Preferred. The step heading explicitly says Bank for the combined route.

Merchant steps explicitly say Merchant: channels; exact card-origin countries and volumes; processing history; preferences; settlement. POS is in-person card acquiring; online acquiring is not the only form of acquiring. Preserve separate charging and settlement currencies, EUR/GBP/USD/Other tickboxes and CHF where applicable. Show optional chargeback and fraud fields without the removed ratio-detail burden. Keep target blended rate optional and useful. Remove the acceptable fixed transaction fee. Named alternative payment methods replace a broad additional-method checklist. Crypto requirements remain optional conditional detail.

Ask whether an existing bank account can receive settlement. Merchant-only applicants can request a bank account and activate the missing bank flows in the same application. The Both route already includes banking and must not ask whether to add it again. Shared company/activity/ownership/contact data is never requested twice.

## Private banking

Page one starts with Name and Surname, nationality/nationalities, country of residence and tax-residence countries. Countries selected remain visible while the searchable list collapses when unused. Do not leave a large country list permanently expanded. Relationship nationality and residence fields align and use the same field height.

Page two asks What are you looking for?, then liquid assets in EUR, then amount expected to place. Bands are EUR 50,000 to under 100,000; 100,000 to under 500,000; 500,000 to under 1 million; 1 million to 5 million; Above 5 million. Below 50,000 allows a truthful declaration and an eligibility explanation rather than forcing a higher value. Avoid overlapping boundary definitions. Remove desired start timing and preferred bank country. Preferred relationship-manager language remains optional. LinkedIn is optional in place of a compulsory CV upload.

Collect concise wealth and funds categories with necessary clarification about the actual incoming source, ownership of funds and relevant countries. Do not demand a lengthy general source-of-wealth essay or pretend documents were verified. Detailed evidence is requested later where justified. The declared liquid-asset band is not itself an account balance, investment pledge or guaranteed provider eligibility.

## Ownership and control

Use Ownership & control. One repeatable person appears initially with Add person. Identify relevant beneficial owners/controllers by name, nationalities and residence, roles and percentage where share ownership applies. Do not impose a universal 75% aggregate floor. Ownership at a threshold does not eliminate control by other means. Relevant control-only persons may have no share percentage.

Limited companies/partnerships use ownership/control roles appropriate to their structure. Associations/foundations identify applicable controlling/governing persons and relevant beneficiary/founder roles without fictional share ownership. Other legal forms require a concise structure clarification. A PLC is not automatically listed, and a listed-company claim is not a verified exemption. Record exchange/disclosure reference and verify any simplified treatment before introduction.

Corporate shareholders require entity name and incorporation country. Group membership Yes requires group name. Group or UBO requests for the same institution use clear optional/essential wording and linked eligibility. Do not offer UBO personal accounts for financing or correspondent applications where irrelevant. Names are required for people identified within the applicable screening scope, with indirect-person notice and lawful processing controls specified separately.

## Optional counterparties

Use repeatable structured records for incoming/outgoing main counterparties where appropriate. Bank, private banking and correspondent own/client-funds scopes remain separate. Each record has durable ID, name, person/entity type, country and relationship. Display Add counterparty only where applicable. Blank optional records do not block submission. A partially filled record must be consistent and country values canonical. Declared names enter the internal subject ledger with direction, scope and provenance; do not infer counterparties from arbitrary text labels.

## Financing and correspondent conditions

Financing collects purpose, amount/currency, intended use, status/stage, latest audited financial year, existing finance, relevant guarantees/security and desired timeline. Do not restore the removed profit/loss, separate annual revenue, audited-sharing Yes/No and period-start/end clutter. Explain repayment period as anticipated time to repay the borrowing where retained; it is not the period for supplying financial statements. Existing banking is collected in the relevant earlier banking/financing module rather than at Contact or Summary.

Correspondent own-funds operational account is mandatory, with optional client-funds, dedicated virtual IBAN/API functions and distinct flows. Underlying regions are concise initially; exact country clarification is needed when provider exceptions require it. Ask for internal/external MLRO existence and internal location where applicable, not irrelevant compliance contact names/emails. MSB country activates Canadian-specific provider requirements only for Canada. These are provider conditions, not universally asserted Canadian legal requirements. CASP activates relevant MiCA status and actual crypto services, assets, self-hosted wallet, Travel Rule and blockchain-screening controls where applicable. Explanations distinguish legal scope from provider requirements.

## Draft persistence and migration

Version 7 draft snapshots use stable explicit or semantic field keys, repeatable record IDs, picker identities, requirement levels, current page, caseId and savedAt. Construct all dynamic fields before restoring. Local persistence contains only fictional prototype records; production uses authenticated server storage with optimistic concurrency and encryption. Do not restore by the ordinal position of input elements.

Migrating older positional drafts uses the frozen legacy schema, preserves review notes and requires review of potentially corrupted flow data. It must not silently certify an old shifted amount. A locally newer draft may beat a stale parent-frame copy only when it belongs to the same case ID. Never restore a different client's draft merely because it was last used in that browser. The final confirmed revision is immutable; a correction creates a new revision and resets relevant readiness/sharing permissions.
