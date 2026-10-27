/** 22 English template families from FinSyndeo Guidelines/templates/EMAIL-TEMPLATES.md */
import { EMAIL_TEMPLATE_BODIES, EMAIL_TEMPLATE_VERSION } from "@/lib/email/template-bodies";

export { EMAIL_TEMPLATE_VERSION };

export const EMAIL_TEMPLATES = {
  E01: {
    id: "E01",
    name: "Account email verification",
    subject: "Verify your SOPHIMA AI email address",
  },
  E02: {
    id: "E02",
    name: "Application saved or submitted",
    subject: "Your SOPHIMA AI application [case reference]",
  },
  E03: {
    id: "E03",
    name: "Clarification needed",
    subject: "Information needed for your SOPHIMA AI request [case reference]",
  },
  E04: {
    id: "E04",
    name: "Potential providers available",
    subject: "Review potential providers for [case reference]",
  },
  E05: {
    id: "E05",
    name: "No current provider found",
    subject: "Update on your SOPHIMA AI request [case reference]",
  },
  E06: {
    id: "E06",
    name: "Eligibility review or policy exclusion",
    subject: "Update on your SOPHIMA AI request [case reference]",
  },
  E07: {
    id: "E07",
    name: "Applicant confirmation for introducer submission",
    subject: "Please confirm the request submitted on your behalf [case reference]",
  },
  E08: {
    id: "E08",
    name: "Introduction requested and sharing approval",
    subject: "Confirm your requested introduction [case reference]",
  },
  E09: {
    id: "E09",
    name: "Official introduction master template",
    subject: "Introduction [applicant legal name] | [service] | [case reference]",
  },
  E10: {
    id: "E10",
    name: "Introduction sent",
    subject: "Your introduction to [institution name] [case reference]",
  },
  E11: {
    id: "E11",
    name: "Additional introduction payment",
    subject: "Payment confirmation for [case reference]",
  },
  E12: {
    id: "E12",
    name: "New suitable provider alert",
    subject: "A new potential provider for your SOPHIMA AI request",
  },
  E13: {
    id: "E13",
    name: "Provider invitation and application",
    subject: "Complete your SOPHIMA AI provider profile",
  },
  E14: {
    id: "E14",
    name: "Provider profile decision or material update",
    subject: "Your SOPHIMA AI provider profile [reference]",
  },
  E15: {
    id: "E15",
    name: "Provider case report available",
    subject: "Your SOPHIMA AI case report for [period]",
  },
  E16: {
    id: "E16",
    name: "Provider commission reporting request",
    subject: "Commission report requested for [agreed period]",
  },
  E17: {
    id: "E17",
    name: "Introducer invitation and agreement",
    subject: "Your SOPHIMA AI introducer invitation",
  },
  E18: {
    id: "E18",
    name: "Introducer rate change",
    subject: "Your SOPHIMA AI commission schedule update",
  },
  E19: {
    id: "E19",
    name: "Introducer commission and invoice availability",
    subject: "Commission statement available for [period]",
  },
  E20: {
    id: "E20",
    name: "Introducer invoice or payment status",
    subject: "Your invoice [invoice number] [status]",
  },
  E21: {
    id: "E21",
    name: "Deletion request acknowledgement and outcome",
    subject: "Your SOPHIMA AI data request [request reference]",
  },
  E22: {
    id: "E22",
    name: "Admin exceptions",
    subject: "SOPHIMA AI action required [case or incident reference]",
  },
} as const;

export type TemplateId = keyof typeof EMAIL_TEMPLATES;

function substitute(text: string, vars: Record<string, string>): string {
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`[${key}]`).join(value);
  }
  return out;
}

export function renderTemplateBody(templateId: TemplateId, vars: Record<string, string>): string {
  const body = EMAIL_TEMPLATE_BODIES[templateId] ?? "";
  return substitute(body, vars);
}

export function renderSubject(templateId: TemplateId, vars: Record<string, string>): string {
  return substitute(EMAIL_TEMPLATES[templateId].subject, vars);
}

/** Renders approved template HTML (delivery.css-aligned inline styles). */
export function renderEmailHtml(
  templateId: TemplateId,
  vars: Record<string, string>,
  bodyOverride?: string
): string {
  const template = EMAIL_TEMPLATES[templateId];
  const rendered = bodyOverride ? substitute(bodyOverride, vars) : renderTemplateBody(templateId, vars);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `<!doctype html><html lang="en"><body style="font-family:'Segoe UI',Arial,sans-serif;background:#faf8f5;color:#191919;padding:24px">
<div style="max-width:600px;margin:auto;background:#ffffff;border:1px solid #e5ded5;border-radius:14px;padding:34px">
<img src="${appUrl}/assets/sophima-ai-logo.png" alt="SOPHIMA AI" width="200" style="margin-bottom:20px"/>
<h2 style="color:#191919;font-size:25px">${template.name}</h2>
${rendered}
<p style="font-size:13px;color:#5c5c5c;margin-top:24px;line-height:1.6">
<strong style="color:#191919">SOPHIMA AI</strong><br/>
Matching and introductions<br/>
Operated by SOPHIMA LTD<br/>
<a href="mailto:introductions@sophima.ai" style="color:#826a50">introductions@sophima.ai</a><br/>
<a href="https://sophima.ai" style="color:#826a50">sophima.ai</a>
</p>
</div></body></html>`;
}
