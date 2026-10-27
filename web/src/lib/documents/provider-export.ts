import { FAMILIES } from "@/lib/provider-apply/config";
import type { ProviderDraftState } from "@/lib/provider-apply/types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildProviderResponsesHtml(
  state: ProviderDraftState,
  meta: { status: string; downloadedAt: string; revisionLabel?: string }
): string {
  const sections: string[] = [];

  sections.push(`<h2>Institution</h2><table>`);
  for (const [k, v] of Object.entries(state.core)) {
    if (v === undefined || v === null || v === "") continue;
    sections.push(`<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`);
  }
  sections.push(`</table>`);

  sections.push(`<h2>Authorisations</h2>`);
  for (const lic of state.licenses) {
    sections.push(`<table>`);
    for (const [k, v] of Object.entries(lic.data)) {
      if (!v) continue;
      sections.push(`<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`);
    }
    sections.push(`</table>`);
  }

  for (const offer of state.offers) {
    sections.push(`<h2>${escapeHtml(FAMILIES[offer.family] ?? offer.family)}</h2><table>`);
    for (const [k, v] of Object.entries(offer.data)) {
      if (v === undefined || v === null || v === "") continue;
      const cell = typeof v === "object" ? JSON.stringify(v) : String(v);
      sections.push(`<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(cell)}</td></tr>`);
    }
    sections.push(`</table>`);
  }

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SOPHIMA AI provider responses</title>
<style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#faf8f4;color:#17202a;margin:0;padding:24px}
article{background:#fff;border:1px solid #ddd5ca;border-radius:14px;padding:34px;max-width:900px;margin:auto}
h1{font-size:28px;color:#233b50}
h2{font-size:18px;margin-top:28px;color:#826a50}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{border-bottom:1px solid #ddd5ca;padding:8px 10px;font-size:13px;vertical-align:top}
.meta{font-size:13px;color:#536071}
</style></head><body><article>
<h1>Provider questionnaire responses</h1>
<p class="meta"><strong>Institution:</strong> ${escapeHtml(String(state.core.legalName ?? "—"))} |
<strong>Status:</strong> ${escapeHtml(meta.status)} |
<strong>Downloaded:</strong> ${escapeHtml(meta.downloadedAt)}
${meta.revisionLabel ? ` | <strong>Revision:</strong> ${escapeHtml(meta.revisionLabel)}` : ""}</p>
${sections.join("\n")}
<p class="meta">Confidential — institution responses only. Not a published profile until SOPHIMA approval.</p>
</article></body></html>`;
}
