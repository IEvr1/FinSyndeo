/** Institution-facing client profiles — six route shapes from guidelines templates. */

export type ProfileRoute =
  | "bank"
  | "merchant"
  | "both"
  | "financing"
  | "private"
  | "correspondent";

export type ClientProfileInput = {
  caseId: string;
  applicantName: string;
  service: string;
  revision: number;
  route: ProfileRoute;
  fields: Array<{ label: string; value: string }>;
  recipientEmail: string;
  institutionLegalName: string;
};

export function buildClientProfileHtml(input: ClientProfileInput): string {
  const rows = input.fields
    .map(
      (f) =>
        `<tr><td>${escapeHtml(f.label)}</td><td>${escapeHtml(f.value)}</td></tr>`
    )
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SOPHIMA AI Client Profile</title>
<style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#faf8f4;color:#17202a;margin:0;padding:24px}
article{background:#fff;border:1px solid #ddd5ca;border-radius:14px;padding:34px;max-width:900px;margin:auto}
h1{font-size:36px;color:#233b50}
.role-label{color:#826a50;font-size:13px;text-transform:uppercase;letter-spacing:.04em}
table{width:100%;border-collapse:collapse;margin-top:20px}
th,td{border-bottom:1px solid #ddd5ca;padding:10px;text-align:left;font-size:14px}
th{background:#faf8f4}
.footer{margin-top:24px;font-size:12px;color:#536071}
</style></head><body><article>
<span class="role-label">External client profile</span>
<h1>SOPHIMA AI Client Profile</h1>
<p><strong>Case:</strong> ${escapeHtml(input.caseId)} | <strong>Applicant:</strong> ${escapeHtml(input.applicantName)} | <strong>Service:</strong> ${escapeHtml(input.service)} | <strong>Revision:</strong> ${input.revision}</p>
<p><strong>Approved recipient:</strong> ${escapeHtml(input.recipientEmail)} at ${escapeHtml(input.institutionLegalName)}</p>
<table><thead><tr><th>Field</th><th>Applicant declared information</th></tr></thead><tbody>${rows}</tbody></table>
<p class="footer">This profile contains applicant-authorised factual information only. Internal risk conclusions, screening evidence, and provider policies are not included. A complete questionnaire is not a complete verified KYC file.</p>
</article></body></html>`;
}

export function buildInternalDdReportHtml(input: {
  caseId: string;
  applicantName: string;
  revision: number;
  screeningSummary: string;
  contradictions: string;
  releaseDecision: string;
}): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SOPHIMA Due Diligence Report — CONFIDENTIAL</title>
<style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#faf8f4;color:#17202a;margin:0;padding:24px}
article{background:#fff;border:2px solid #82432f;border-radius:14px;padding:34px;max-width:900px;margin:auto}
.confidential{color:#82432f;font-weight:bold;font-size:14px}
h1{font-size:36px;color:#233b50}
</style></head><body><article>
<p class="confidential">CONFIDENTIAL — SOPHIMA INTERNAL ONLY. Never sent to a provider automatically.</p>
<h1>SOPHIMA Due Diligence Report</h1>
<p><strong>Case:</strong> ${escapeHtml(input.caseId)} | <strong>Subject:</strong> ${escapeHtml(input.applicantName)} | <strong>Revision:</strong> ${input.revision}</p>
<h2>Screening coverage</h2><p>${escapeHtml(input.screeningSummary)}</p>
<h2>Contradictions and unresolved items</h2><p>${escapeHtml(input.contradictions)}</p>
<h2>Release decision</h2><p>${escapeHtml(input.releaseDecision)}</p>
</article></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
