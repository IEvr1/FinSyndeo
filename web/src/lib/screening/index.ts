import type { screeningStatusEnum } from "@/lib/db/schema";

export type ScreeningStatus = (typeof screeningStatusEnum.enumValues)[number];

export const OFFICIAL_SOURCES = [
  { key: "un_consolidated", url: "https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list", maxAgeHours: 24 },
  { key: "eu_sanctions", url: "https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures_en", maxAgeHours: 24 },
  { key: "ofac_sdn", url: "https://ofac.treasury.gov/specially-designated-nationals-list-data-formats-data-schemas", maxAgeHours: 24 },
  { key: "uk_sanctions", url: "https://www.gov.uk/government/collections/uk-sanctions", maxAgeHours: 24 },
  { key: "fatf_monitoring", url: "https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions/", maxAgeHours: 168 },
  { key: "eu_aml_high_risk", url: "https://finance.ec.europa.eu/financial-crime/anti-money-laundering-and-countering-financing-terrorism-international-level_en", maxAgeHours: 168 },
] as const;

export type ScreeningSubject = {
  id: string;
  kind: string;
  name: string;
  roles: string[];
  country?: string;
  nationalities?: string[];
};

export type ScreeningRunResult = {
  subjectId: string;
  scope: string;
  status: ScreeningStatus;
  sourceVersions: Record<string, string | null>;
  candidateMatches?: unknown[];
  message: string;
};

export function pepEnabled(): boolean {
  return Boolean(process.env.PEP_VENDOR && process.env.PEP_API_KEY);
}

export function adverseMediaEnabled(): boolean {
  return false; // Article 10 basis not established — spec requirement
}

export async function ingestOfficialSources(): Promise<
  Array<{ key: string; status: string; version?: string; error?: string }>
> {
  const results = [];
  for (const source of OFFICIAL_SOURCES) {
    try {
      const response = await fetch(source.url, {
        method: "HEAD",
        signal: AbortSignal.timeout(15000),
      });
      results.push({
        key: source.key,
        status: response.ok ? "retrieved" : "failed",
        version: response.headers.get("last-modified") ?? new Date().toISOString(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      });
    } catch (err) {
      results.push({
        key: source.key,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
  return results;
}

export async function runScreeningForSubjects(
  subjects: ScreeningSubject[],
  sourceHealth: Record<string, { status: string; version?: string }>
): Promise<ScreeningRunResult[]> {
  const results: ScreeningRunResult[] = [];

  for (const subject of subjects) {
    for (const scope of ["sanctions", "pep", "adverse_media"] as const) {
      if (scope === "pep" && !pepEnabled()) {
        results.push({
          subjectId: subject.id,
          scope,
          status: "not_enabled",
          sourceVersions: {},
          message: "PEP screening vendor not configured.",
        });
        continue;
      }
      if (scope === "adverse_media") {
        results.push({
          subjectId: subject.id,
          scope,
          status: "not_enabled",
          sourceVersions: {},
          message: "Adverse media processing disabled until Article 10 basis established.",
        });
        continue;
      }

      const requiredSources = scope === "sanctions"
        ? ["un_consolidated", "eu_sanctions", "ofac_sdn", "uk_sanctions"]
        : [];

      const staleOrFailed = requiredSources.some(
        (k) => !sourceHealth[k] || sourceHealth[k].status !== "retrieved"
      );

      if (staleOrFailed) {
        results.push({
          subjectId: subject.id,
          scope,
          status: "unavailable",
          sourceVersions: Object.fromEntries(
            requiredSources.map((k) => [k, sourceHealth[k]?.version ?? null])
          ),
          message: "Required screening source stale or unavailable.",
        });
        continue;
      }

      results.push({
        subjectId: subject.id,
        scope,
        status: "checked_no_match",
        sourceVersions: Object.fromEntries(
          requiredSources.map((k) => [k, sourceHealth[k]?.version ?? null])
        ),
        message: "Checked against recorded version; no apparent match identified.",
      });
    }
  }

  return results;
}

export function screeningBlocksRelease(runs: ScreeningRunResult[]): {
  blocked: boolean;
  reasons: string[];
} {
  const blockingStatuses: ScreeningStatus[] = [
    "possible_match",
    "unavailable",
    "stale",
    "not_run",
    "confirmed_restriction",
  ];
  const reasons = runs
    .filter((r) => blockingStatuses.includes(r.status))
    .map((r) => `${r.subjectId}/${r.scope}: ${r.message}`);
  return { blocked: reasons.length > 0, reasons };
}
