/** Introducer agreement content from guidelines — placeholders retained. */

export const MASTER_AGREEMENT_HEADER = `# FinSyndeo / SOPHIMA — Introducer Agreement

**NOT FOR EXECUTION**

**SOPHIMA:** [full legal contracting entity], registered in [jurisdiction] under number [number], with registered address [address]

**Introducer:** [full legal name / registered company name]

**Effective date:** [date and time, including time zone]
`;

export const SCHEDULE_STANDARD_RATES = `
| Distinct qualified successful clients | Applicable share |
| One | 30% |
| Two | 40% |
| Three or more | 50% |
`;

export function agreementHasUnresolvedPlaceholders(content: string): boolean {
  return /\[[^\]]+\]/.test(content);
}

export function buildAgreementDraft(type: "master" | "standard" | "bespoke"): string {
  const bespokeRate = type === "bespoke" ? "\n**Agreed rate:** [agreed percentage]%" : "";
  return `${MASTER_AGREEMENT_HEADER}${SCHEDULE_STANDARD_RATES}${bespokeRate}\n\nNOT FOR EXECUTION`;
}
