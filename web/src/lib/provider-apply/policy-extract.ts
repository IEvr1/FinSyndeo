import { INDUSTRIES, STATUS_OPTIONS } from "./config";
import { aiExtractField } from "@/lib/integrations";

export type ExtractedCountryRule = {
  axis: string;
  country: string;
  status: string;
  note?: string;
};

export type PolicyExtractionResult = {
  countryRules: ExtractedCountryRule[];
  industryHints: Record<string, string>;
  warnings: string[];
  source: "heuristic" | "ai" | "mixed";
};

const STATUS_BY_KEYWORD: Array<[RegExp, string]> = [
  [/not\s+support|prohibit|excluded|refuse/i, "no"],
  [/enhanced\s+due\s+diligence|edd/i, "edd"],
  [/case.by.case|subject\s+to\s+review/i, "review"],
  [/support|accept|permit/i, "yes"],
];

function guessStatus(text: string): string {
  for (const [re, status] of STATUS_BY_KEYWORD) {
    if (re.test(text)) return status;
  }
  return "unknown";
}

/** Lightweight extraction from pasted/uploaded policy text (AI enriches when configured). */
export function extractPolicyHeuristic(text: string): PolicyExtractionResult {
  const warnings: string[] = [];
  const countryRules: ExtractedCountryRule[] = [];
  const industryHints: Record<string, string> = {};

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 500)) {
    const countryMatch = line.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
    if (countryMatch && /country|jurisdiction|incorporat|nationality|residence|payment/i.test(line)) {
      const axis = /nationality/i.test(line)
        ? "nationality"
        : /residence/i.test(line)
          ? "residence"
          : /incorporat/i.test(line)
            ? "incorporation"
            : /payment|incoming|outgoing/i.test(line)
              ? "incoming"
              : "incorporation";
      for (const c of countryMatch.slice(0, 3)) {
        if (c.length > 3 && c.length < 40) {
          countryRules.push({ axis, country: c, status: guessStatus(line), note: line.slice(0, 200) });
        }
      }
    }
    for (const industry of INDUSTRIES) {
      if (line.toLowerCase().includes(industry.toLowerCase().slice(0, 12))) {
        industryHints[industry] = guessStatus(line);
      }
    }
  }

  if (!countryRules.length) {
    warnings.push("No country rules could be inferred automatically. Review manually or use Enter policy manually.");
  }

  return { countryRules, industryHints, warnings, source: "heuristic" };
}

export async function extractAcceptancePolicy(text: string): Promise<PolicyExtractionResult> {
  const heuristic = extractPolicyHeuristic(text);
  if (!text.trim()) return heuristic;

  const ai = await aiExtractField({
    prompt: `Extract country acceptance rules from this provider policy. Return JSON with countryRules array (axis, country, status one of ${STATUS_OPTIONS.map((s) => s[0]).join("|")}) and industryHints object.\n\nPolicy text:\n${text.slice(0, 12000)}`,
    fieldSchema: { type: "object" },
  });

  if (ai.error || !ai.value || typeof ai.value !== "object") {
    return heuristic;
  }

  const v = ai.value as { countryRules?: ExtractedCountryRule[]; industryHints?: Record<string, string> };
  return {
    countryRules: v.countryRules?.length ? v.countryRules : heuristic.countryRules,
    industryHints: { ...heuristic.industryHints, ...(v.industryHints ?? {}) },
    warnings: heuristic.warnings,
    source: v.countryRules?.length ? "mixed" : "heuristic",
  };
}
