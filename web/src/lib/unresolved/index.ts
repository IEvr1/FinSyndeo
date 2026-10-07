export type UnresolvedParticular = {
  key: string;
  category: string;
  description: string;
  blocksActions: string[];
  resolved: boolean;
  note?: string;
};

/** Placeholders from guidelines — flagged, not filled with assumptions. */
export const UNRESOLVED_PARTICULARS: UnresolvedParticular[] = [
  {
    key: "sophima_contracting_entity",
    category: "legal",
    description: "SOPHIMA full legal contracting entity, registration number, address, and authorised signatory.",
    blocksActions: ["agreement_execution", "provider_listing", "introducer_activation"],
    resolved: false,
  },
  {
    key: "governing_law_forum",
    category: "legal",
    description: "Governing law, dispute forum, liability exclusions, and notice rules for introducer agreements.",
    blocksActions: ["agreement_execution"],
    resolved: false,
  },
  {
    key: "data_protection_roles",
    category: "privacy",
    description: "Controller/processor roles, incident contacts, and complete retention register.",
    blocksActions: ["privacy_erasure_complete"],
    resolved: false,
  },
  {
    key: "non_circumvention",
    category: "legal",
    description: "Non-circumvention scope, duration, and reviewed exceptions.",
    blocksActions: ["agreement_execution"],
    resolved: false,
  },
  {
    key: "payment_period",
    category: "commercial",
    description: "Introducer payment period, invoice requirements, and authorised deduction categories.",
    blocksActions: ["agreement_execution"],
    resolved: false,
  },
  {
    key: "termination_tail",
    category: "commercial",
    description: "Post-termination commission entitlement for previously attributed relationships.",
    blocksActions: ["termination_policy_automation"],
    resolved: false,
    note: "Held pending contractual policy — accrued balances are not forfeited.",
  },
  {
    key: "bespoke_schedule_option",
    category: "commercial",
    description: "Which bespoke Schedule 1 option applies per introducer and the agreed percentage.",
    blocksActions: ["bespoke_rate_activation"],
    resolved: false,
  },
  {
    key: "introduction_fee_tax",
    category: "commercial",
    description: "Production introduction fee amount, currency, tax treatment, and consumer cancellation terms.",
    blocksActions: ["paid_introduction_checkout"],
    resolved: false,
  },
  {
    key: "country_exclusion_policy",
    category: "compliance",
    description: "Complete approved Group 1 country exclusion policy with legal nexus — not the Russia/Iran review sample.",
    blocksActions: ["introduction_release"],
    resolved: false,
  },
  {
    key: "pep_vendor",
    category: "integrations",
    description: "PEP screening vendor and lawful scope.",
    blocksActions: ["pep_screening"],
    resolved: false,
  },
  {
    key: "email_provider",
    category: "integrations",
    description: "Production email provider credentials.",
    blocksActions: ["email_dispatch"],
    resolved: false,
  },
  {
    key: "payment_gateway",
    category: "integrations",
    description: "Payment gateway name and credentials.",
    blocksActions: ["paid_introduction_checkout"],
    resolved: false,
  },
  {
    key: "voice_provider",
    category: "integrations",
    description: "Realtime voice provider for guided intake.",
    blocksActions: ["voice_intake"],
    resolved: false,
  },
  {
    key: "malware_scanner",
    category: "integrations",
    description: "Malware scanner for uploaded documents.",
    blocksActions: ["document_extraction"],
    resolved: false,
  },
  {
    key: "c01_entitlement_timestamp",
    category: "accounting",
    description: "Final approved ledger posting (C01) — already decided.",
    blocksActions: [],
    resolved: true,
    note: "Rate resolves at final approved ledger posting per ACCOUNTING-SPEC C01.",
  },
  {
    key: "c03_financing_qualification",
    category: "accounting",
    description: "First verified disbursement (C03) — already decided.",
    blocksActions: [],
    resolved: true,
    note: "Financing qualifies only on first verified disbursement per ACCOUNTING-SPEC C03.",
  },
];

export function getUnresolved(): UnresolvedParticular[] {
  return UNRESOLVED_PARTICULARS.filter((p) => !p.resolved);
}

export function blocksAction(action: string): UnresolvedParticular[] {
  return UNRESOLVED_PARTICULARS.filter(
    (p) => !p.resolved && p.blocksActions.includes(action)
  );
}

export function isActionBlocked(action: string): { blocked: boolean; particulars: UnresolvedParticular[] } {
  const particulars = blocksAction(action);
  return { blocked: particulars.length > 0, particulars };
}
