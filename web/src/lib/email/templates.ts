/** 22 English template families from EMAIL-TEMPLATES.md */

export const EMAIL_TEMPLATES = {
  E01: {
    id: "E01",
    name: "Account email verification",
    subject: "Verify your FinSyndeo email address",
  },
  E02: {
    id: "E02",
    name: "Application saved or submitted",
    subject: "Your FinSyndeo assessment has been saved",
  },
  E03: {
    id: "E03",
    name: "Clarification needed",
    subject: "Additional information needed for your FinSyndeo assessment",
  },
  E04: {
    id: "E04",
    name: "Potential providers available",
    subject: "Potential providers are available for your assessment",
  },
  E05: {
    id: "E05",
    name: "No current provider found",
    subject: "Update on your FinSyndeo provider search",
  },
  E06: {
    id: "E06",
    name: "Eligibility review or policy exclusion",
    subject: "Your FinSyndeo assessment requires review",
  },
  E07: {
    id: "E07",
    name: "Applicant confirmation for introducer submission",
    subject: "Please confirm your FinSyndeo application",
  },
  E08: {
    id: "E08",
    name: "Introduction requested and sharing approval",
    subject: "Action required: approve sharing for your introduction",
  },
  E09: {
    id: "E09",
    name: "Official introduction master template",
    subject: "FinSyndeo introduction",
  },
  E10: {
    id: "E10",
    name: "Introduction sent",
    subject: "Your FinSyndeo introduction has been sent",
  },
  E11: {
    id: "E11",
    name: "Additional introduction payment",
    subject: "Payment required for additional introduction",
  },
  E12: {
    id: "E12",
    name: "New suitable provider alert",
    subject: "A new suitable provider is available",
  },
  E13: {
    id: "E13",
    name: "Provider invitation and application",
    subject: "Invitation to join FinSyndeo as a provider institution",
  },
  E14: {
    id: "E14",
    name: "Provider profile decision or material update",
    subject: "Update on your FinSyndeo provider profile",
  },
  E15: {
    id: "E15",
    name: "Provider case report available",
    subject: "A case report is available in your provider account",
  },
  E16: {
    id: "E16",
    name: "Provider commission reporting request",
    subject: "Commission reporting requested",
  },
  E17: {
    id: "E17",
    name: "Introducer invitation and agreement",
    subject: "Invitation to join FinSyndeo as an introducer",
  },
  E18: {
    id: "E18",
    name: "Introducer rate change",
    subject: "Update to your FinSyndeo commission terms",
  },
  E19: {
    id: "E19",
    name: "Introducer commission and invoice availability",
    subject: "Commission entries are available to invoice",
  },
  E20: {
    id: "E20",
    name: "Introducer invoice or payment status",
    subject: "Update on your FinSyndeo invoice",
  },
  E21: {
    id: "E21",
    name: "Deletion request acknowledgement and outcome",
    subject: "Your data request — FinSyndeo",
  },
  E22: {
    id: "E22",
    name: "Admin exceptions",
    subject: "FinSyndeo admin exception requires attention",
  },
} as const;

export type TemplateId = keyof typeof EMAIL_TEMPLATES;

export function renderEmailHtml(
  templateId: TemplateId,
  body: string,
  vars: Record<string, string>
): string {
  const template = EMAIL_TEMPLATES[templateId];
  let rendered = body;
  for (const [key, value] of Object.entries(vars)) {
    rendered = rendered.replace(new RegExp(`\\[${key}\\]`, "g"), value);
  }
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#faf8f5;color:#181818;padding:24px">
<div style="max-width:600px;margin:auto;background:#fff;border:1px solid #ded4c8;border-radius:10px;padding:24px">
<img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/FinSyndeo-logo.png" alt="FinSyndeo" width="180" style="margin-bottom:20px"/>
<h2 style="color:#826a50">${template.name}</h2>
${rendered}
<p style="font-size:12px;color:#655b53;margin-top:24px">FinSyndeo by SOPHIMA</p>
</div></body></html>`;
}
