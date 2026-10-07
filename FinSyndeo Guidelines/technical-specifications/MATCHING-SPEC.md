# Applicant and provider matching contract

Approved implementation reference, 7 October 2026. The criterion catalogue, typed applicant snapshots, provider offers and calculated result explain each decision. The runtime matcher is a local demonstration of deterministic evaluation; live legal screening remains a separate release requirement.

## Evaluation order

1. Validate the confirmed assessment schema and applicable service components. A malformed or missing typed snapshot cannot produce an eligible match.
2. Require a currently approved, available provider with a verified referral agreement and a published product policy. Pending profiles, parsed documents and unconfirmed criteria cannot establish support.
3. Evaluate each product in a requested family independently. Within a product, all applicable essential requirements must pass. Alternative products are OR choices; one failing alternative does not exclude a passing product.
4. For Both, select a bank product and a merchant product independently and require both to pass before presenting that institution as supporting the whole request. A production provider-pair search applies the same tests independently to two institutions and labels the split solution explicitly. The included prototype computes individual product components within a provider; a two-institution combined shortlist remains a backend requirement, not a claim that the UI already composes every possible pair.
5. Essential No means unsupported. Essential Unknown or Case by case means conditional unless another essential criterion already fails. Inactive, unavailable or unsigned providers cannot be rescued by a score.
6. Compute preference fit only from explicitly supplied preferences. Return Not scored if none exists. Calculate data coverage separately. Every criterion includes its key, level, result, reason and provider revision/provenance.

The local API is `FinSyndeoMatching.capture(document)`, `evaluate(snapshot, providers, publishedProfiles, options)` and `fixtureProfile(provider)`. A snapshot may contain `.typed`; the matcher consumes it rather than extracting semantics from displayed labels. Options supplies an evaluation date. Approved production rules must also carry regulatory and evidence versions.

## Typed applicant data

Common structure: schemaVersion, route, applicant, business, requirements, counterparties, context and screeningSubjects. Applicant contains kind, identity, incorporation or personal countries, persons, legal-entity shareholders, group context and ownership declaration. Each person carries a stable ID, name, roles, nationality array, residence and share percentage where meaningful. Control-only persons do not need an invented positive percentage. Counterparties identify direction and bank/private/operational/client scope.

Requirements are scoped by family: bank, merchant, private, finance or correspondent. Currency and capability requirements carry value, key and essential/preferred level. Neither legal prohibitions nor truthful identity/country facts become optional preferences. Other currencies must map to actual ISO codes; unresolved codes require clarification.

Bank requirements include purpose/facilities, currencies, reporting currency, incoming and outgoing countries, transfer counts and values, and applicable product balance or transfer constraints. Merchant requirements distinguish card-charge and settlement currencies, channels, card-origin country percentages, projected volume/count, average/maximum ticket, processing history, optional ratios, gateway retention preference, named APMs, crypto requirements and settlement arrangements. Optional unknown metrics remain conditional only where a particular product needs them; they are not guessed as zero.

Private requirements include needs, liquid-asset band in EUR, placement, investment amount where relevant, currency priorities, wealth/funding categories, own-funds declaration, origin/corridor countries and optional relationship language. A band that crosses a provider minimum requires an exact clarification; do not qualify it using its upper bound. Financing includes purpose, amount/currency, stage, relevant project country, security, existing finance, audited year, term where supplied and timeline. Correspondent requirements distinguish own/client-funds activity, institution type, regulatory status, underlying client types/sectors/countries, downstream use, compliance controls, and Canadian MSB or CASP conditions when applicable.

## Provider policy structure

A published profile has ID, approvalStatus, version, effective/review dates, documents and offers. Each offer has ID, family, data and geographic rules. A geographic rule has an explicit default and exceptions with supported, prohibited, review or unknown outcomes. Never equate an absent exclusion with universal support unless the provider explicitly confirmed that default.

Product data uses canonical capability, industry, legal-form, institution-type, currency and payment-network definitions. Declare whether the capability and limit disclosures are complete. A blank maximum is not automatically unlimited; completeness must be explicitly affirmed. Record the currency and period for each limit. Unknown currency conversion means clarification, not comparison of nominal values.

Product policy covers applicant and owner countries, incorporation/residence/tax, legal forms, industry, sector permission/EU agent arrangements, offices/employees, service capabilities, currency support, payment/IBAN functions, own/client flow limits, private minimums and accepted funding sources, merchant history/ratios/tickets/gateway/APMs/crypto, finance facilities/evidence/security, and correspondent regulatory/client/compliance conditions. Detailed narrative conditions require an approved structured interpretation before automatic support. Expired or future policy conditions cannot silently pass.

## Scores and evidence coverage

For supplied preference criteria, fit = 100 × supported preference weight ÷ total applicable supplied preference weight. The prototype uses weight 1 per preference. Unconfirmed preferences do not count as supported. Preference coverage = confirmed supported-or-prohibited preference weight ÷ total supplied preference weight. Overall criterion coverage = explicitly supported-or-prohibited evaluated criteria ÷ applicable evaluated criteria. A high coverage can accompany an unsupported result; coverage describes evidence, not goodness.

Do not fabricate 92%, 89% or any other fixed fit value for current applications. Deterministic tie breaking uses eligibility state, then computed preference fit where available, then coverage and stable product/provider ID. User sorting, ratings and commercial settings are independent of eligibility. Store the actual formula version and criterion explanations in MatchSnapshot.

## Country and identity axes

Incorporation, nationality, residence, tax residence, UBO nationality/residence, shareholder jurisdiction, incoming/outgoing countries, project location and underlying-client countries are independent. Expand EU only for transfer-flow selections. Merchant allocations remain exact country percentages totalling 100. Broad underlying regions can be used for initial collection, but product exceptions require exact exposure clarification before automatic eligibility. A canonical unknown or unsupported country is never replaced with a convenient accepted country.

The provider matcher evaluates commercial acceptance. Applicable sanctions, FATF/EU risk, SOPHIMA policy, name-screening evidence and release-readiness are separate. A supported country policy does not establish that a person is not sanctioned. PEP or adverse-media results cannot be inferred from the questionnaire or a provider tickbox.

## Documents and policy updates

Country/industry lists and any other provider document may be uploaded for internal analysis. Confirm scope, product, positive/prohibited meaning, unlisted default, mapping, effective date and expiry. Store file hash and source rows/paragraphs. Extraction proposes rules and conflicts; it cannot publish them. Admin publication creates an immutable revision and invalidates dependent match snapshots. Applicant-facing explanations use confirmed support and permitted benefits without exposing provider documents.

## Important implementation boundaries

Do not treat an essential linked group account or UBO personal account as automatically supported. Each additional entity/person needs its own applicable declaration, permission and eligibility assessment. The local matcher returns clarification for an essential linked relationship until these exist. The production model must link the assessments explicitly.

Conditional counterparties are screened only where relevant to the service/funds scope. Named optional counterparties cannot become mandatory universally. Ratio thresholds need comparable transaction-count/value definitions and observation periods; optional client fields remain optional, with product-specific clarification when needed. Target pricing is preference information and never a sanctions/eligibility bypass.

The JSON criterion dictionary includes the audit coverage catalogue and stable applicant/provider paths. The UI field dictionary captures actual generated fields and choices for each route. These are implementation inputs, not proof of production integration. Renos must test every applicable criterion server-side, including criteria whose production outcome depends on registry/licensing evidence, policy extraction or provider-pair search.
