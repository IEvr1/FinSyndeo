# FinSyndeo — Screening continuity and release controls

6 October 2026 · Technical design proposal, not a connected service or legal opinion.

## Scope

SOPHIMA acts as an introducer under the user-confirmed design premise. Screening must have a documented lawful purpose and scope; it is not presented as the institution's completed KYC. Necessary applicant, identified controller/UBO/director, corporate-chain and relevant named-counterparty checks are linked to explicit subjects. Adding affiliates needs evidence and relevance. Sensitive or criminal-offence processing has a separate lawful-scope gate.

## Source register

| Source | What the system must store | Important distinction |
|---|---|---|
| UN Security Council consolidated list and applicable measures | Official source URL, published/retrieved versions, integrity hash, authority/regime and actual designations | Countries associated with a listed person are not automatically prohibited countries |
| EU consolidated financial sanctions data and applicable restrictive measures | Current authoritative data plus governing instruments, entity/person identifiers and ownership/control analysis | A name list alone is not all sectoral/service restrictions |
| OFAC SDN and other applicable US measures | Applicable nexus, list/source version, aliases/identifiers and regime-specific ownership logic | Do not apply the US ownership rule as if it were every jurisdiction's rule |
| UK Sanctions List and applicable regulations | Current UK source and measures; migrate away from the closed OFSI consolidated feed | UK applicability and ownership/control tests require their own rules |
| FATF calls for action / increased monitoring | Status, publication date, source and country code | Risk classification, not a universal sanctions ban |
| EU AML high-risk third-country list | Current legal instrument, effective date and country code | Separate from FATF; duties depend on the actor's scope |
| SOPHIMA policy and provider acceptance | Approved owner, reason, product/axis scope, start/end, review date and version | Commercial refusal must not be mislabelled as a legal sanction |

Source selection and applicable jurisdiction/nexus require legal review. Do not hardcode a permanently banned nationality list by extracting all countries mentioned in name lists.

## Freshness and failure handling

Use server jobs to ingest official/vendor updates at supported intervals, with push/change signals where available. Record last successful retrieval, last published version, transformation status, errors and configured maximum age by source. The Admin health view should distinguish Unchanged current source from Retrieval failed and Source too old.

At submission and immediately before release, check the current subject/fact revision against applicable source/rule versions. Material identity, ownership, nationality, residence, tax, corridor, activity or provider changes invalidate the relevant readiness snapshot. A new designation/rule version schedules necessary re-screening of active cases and unsettled releases.

If a mandatory source/check is stale, unavailable or incomplete, set a release hold and explain a neutral temporary-check status. Do not automatically report “sanctioned” or “no provider supports you”. No score, paid introduction or Admin convenience flag bypasses the gate. A controlled exception needs an authorised basis and evidence and cannot override a legal prohibition.

“Real time” means current available verified source versions evaluated at the relevant action, not an assurance that government lists are continuously instantaneous or that all related entities are known.

## Result states

- Not run / Not enabled in lawful scope.
- Checked against recorded version; no apparent match identified.
- Possible identity match; release held for resolution.
- Identity resolved as false positive, with evidence and decision.
- Confirmed relevant restriction under a recorded applicable rule.
- SOPHIMA-policy exclusion, separately labelled.
- Provider-policy mismatch, product and country-axis specific.
- Required check unavailable or stale.

An apparent PEP is not automatically a prohibited person. Media allegations are not factual findings. A competent review resolves uncertainty under the applicable law and approved policy; the UI does not publicise sensitive watchlist allegations.

## Subject and evidence model

Each subject has stable person/entity ID, canonical and alias names, appropriate country dimensions, role(s), official identifier or proportionate disambiguators, source and relevance. Each screening run has subject revision, provider/regime, rule/list version, time, match evidence, status, reviewer/decision and expiry. A graph edge has separate role, ownership percentage/control description, jurisdiction, source and confidence; no guessed ownership from a director listing.

Website and registry retrieval is bounded, protects against SSRF and treats content as untrusted evidence. Respect source-access limits; blocked/paid/unavailable registries become Unknown, not fabricated extracts. AI summaries preserve source links, retrieved date and contradictions. An AI output cannot authenticate a company, establish licence scope or authorise a decision alone.

## Minimum acceptance scenarios

1. Identical data submitted via form, guided text, future voice, direct API or import gets the same applicable gate.
2. A relevant named counterparty is present in the job and internal report; blank optional counterparties are Not supplied.
3. Possible common-name hit is held; a documented false positive can be resolved without deleting the declared nationality.
4. Russia/Iran nationality/residence/tax combinations are evaluated against actual current law, SOPHIMA policy and product rules, including legally relevant exceptions; an all-nationality blanket is not invented from a list.
5. FATF-monitoring status does not create a fake sanctions finding. An approved commercial country exclusion remains explicit.
6. A list/rule update between matching and introduction invalidates stale clearance and stops the queued release.
7. Feed outage or expired licence evidence prevents an unqualified introduction-ready status.
8. Declared beneficial ownership and control are evaluated under the applicable regime, including indirect/aggregated relationships where required.
9. Internal DD evidence is excluded from the default external bank package; institution-specific sharing revision is enforced.
10. Withdrawal, account closure or expired authority suppresses queued messages and releases; minimal lawfully retained evidence follows the retention register.

## Source references

Official UN list: [UN Security Council consolidated list](https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list).

EU source context: [EU sanctions](https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures_en).

US ownership distinction: [OFAC FAQ 401](https://ofac.treasury.gov/faqs/401).

UK change: [UK sanctions collection](https://www.gov.uk/government/collections/uk-sanctions).

FATF distinction: [June 2026 increased monitoring](https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions/increased-monitoring-june-2026.html).

EU AML countries: [Commission international AML information](https://finance.ec.europa.eu/financial-crime/anti-money-laundering-and-countering-financing-terrorism-international-level_en).
