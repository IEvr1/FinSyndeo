/**
 * Verification against FinSyndeo Changes for Applicant Private.docx (written requirements).
 * Run: node scripts/verify-applicant-changes.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

function read(rel) {
  return readFileSync(join(src, rel), "utf8");
}

function hasAll(rel, patterns) {
  const text = read(rel);
  return patterns.every((p) => (typeof p === "string" ? text.includes(p) : p.test(text)));
}

const checks = [
  {
    id: "dashboard-four-cards",
    name: "Applicant dashboard — four cards and subtitle",
    ok: hasAll("app/applicant/ApplicantDashboard.tsx", [
      "Find suitable providers and manage your applications",
      "Start an assessment",
      "View my assessments",
      "View results",
      "Manage notifications",
    ]),
  },
  {
    id: "dashboard-continue",
    name: "Applicant dashboard — continue unfinished assessment",
    ok: hasAll("app/applicant/ApplicantDashboard.tsx", ["Continue your assessment"]),
  },
  {
    id: "find-provider",
    name: "Find a provider — questionnaire vs AI guidance copy",
    ok: hasAll("app/applicant/find/page.tsx", [
      "Complete your assessment yourself or with AI guidance",
      "Start questionnaire",
      "Start with AI guidance",
      "typed guidance",
    ]),
  },
  {
    id: "find-no-account-list",
    name: "Find a provider — no account-type list on entry page",
    ok: !read("app/applicant/find/page.tsx").includes("Merchant account") && !read("app/applicant/find/page.tsx").includes("Financing"),
  },
  {
    id: "questionnaire-start",
    name: "Questionnaire start — Privacy Notice acknowledgement",
    ok: hasAll("components/QuestionnaireWizard.tsx", [
      "Start your assessment",
      "I have read the",
      "Privacy Notice",
      "Discard this draft",
    ]),
  },
  {
    id: "applicant-type-cards",
    name: "Applicant type — visible cards (Individual / Legal entity / FI)",
    ok: hasAll("components/questionnaire/ApplicantRouteSelector.tsx", [
      "Individual",
      "Legal entity",
      "Financial institution",
      "Business bank account",
    ]),
  },
  {
    id: "individual-no-contact-step",
    name: "Individual route — Contact step removed from flow",
    ok: read("lib/questionnaire/flows.ts").includes("[0, 1, 20, 21, 22, 23, 40]"),
  },
  {
    id: "pb-step-titles",
    name: "Private banking step titles renamed",
    ok: hasAll("lib/questionnaire/step-meta.ts", [
      "Your private banking needs",
      "Your background & funding",
      "Expected account activity",
      "Your assessment summary",
    ]),
  },
  {
    id: "entity-details-label",
    name: "Legal entity — Entity details step title helper",
    ok: read("lib/questionnaire/step-meta.ts").includes("Entity details"),
  },
  {
    id: "ownership-control",
    name: "Ownership & control label",
    ok: read("lib/questionnaire/step-meta.ts").includes("Ownership & control"),
  },
  {
    id: "hide-entity-for-individual",
    name: "Individual — hide entity fields via visibility rules",
    ok: read("lib/questionnaire/visibility.ts").includes('applicant === "individual"'),
  },
  {
    id: "confirm-matches-button",
    name: "Summary — Confirm & find potential matches",
    ok: read("components/QuestionnaireWizard.tsx").includes("Confirm & find potential matches"),
  },
  {
    id: "results-anonymous",
    name: "Results — Provider option labels and View solution",
    ok: hasAll("components/applicant/ResultsFlow.tsx", ["Provider option", "View solution"]),
  },
  {
    id: "results-no-unsupported",
    name: "Results — filter to eligible/conditional only",
    ok: read("components/applicant/ResultsFlow.tsx").includes('m.status === "eligible"'),
  },
  {
    id: "results-empty",
    name: "Results — empty state when no providers qualify",
    ok: read("components/applicant/ResultsFlow.tsx").includes(
      "We could not identify a suitable provider based on your current requirements"
    ),
  },
  {
    id: "review-provider-option",
    name: "Introduction review — Review this provider option",
    ok: read("components/applicant/ResultsFlow.tsx").includes("Review this provider option"),
  },
  {
    id: "sharing-in-intro",
    name: "Sharing — combined approval wording",
    ok: read("components/applicant/ResultsFlow.tsx").includes(
      "I authorise SOPHIMA to share the client profile"
    ),
  },
  {
    id: "introductions-copy",
    name: "My introductions — updated heading and empty state",
    ok: hasAll("components/applicant/ResultsFlow.tsx", [
      "Track your introduction requests",
      "No introductions requested yet. Review your potential providers",
    ]),
  },
  {
    id: "introductions-no-journey-bar",
    name: "My introductions — no progress bar on list",
    ok: (() => {
      const block = read("components/applicant/ResultsFlow.tsx");
      const start = block.indexOf('if (view === "introductions")');
      const end = block.indexOf('if (view === "checkout"', start);
      const introBlock = block.slice(start, end);
      return !introBlock.includes("ClientJourneySteps");
    })(),
  },
  {
    id: "match-notifications",
    name: "Match notifications — threshold 70–100 and Save preferences",
    ok: hasAll("app/applicant/alerts/page.tsx", ["70%", "80%", "90%", "100%", "Save preferences"]),
  },
  {
    id: "sharing-nav-removed",
    name: "Sharing permissions removed from applicant nav",
    ok: !read("lib/nav/config.ts").includes("Sharing permissions"),
  },
  {
    id: "sharing-redirect",
    name: "Old sharing URL redirects to introductions",
    ok: read("app/applicant/sharing/page.tsx").includes('view", "introductions"'),
  },
  {
    id: "sign-in-data-settings",
    name: "Sign-in & data settings page for applicants",
    ok: hasAll("app/applicant/privacy/page.tsx", [
      "Sign-in & data settings",
      "Your sign-in",
      "Your information",
      "Download my information",
    ]) || hasAll("app/applicant/privacy/page.tsx", [
      "Sign-in &amp; data settings",
      "Your sign-in",
      "Your information",
      "Download my information",
    ]),
  },
  {
    id: "nav-sign-in-data",
    name: "Sidebar — Sign-in & data settings label",
    ok: read("lib/nav/config.ts").includes("Sign-in & data settings"),
  },
  {
    id: "brand-colour",
    name: "Brand colour #826A50",
    ok: hasAll("app/globals.css", ["#826a50"]),
  },
  {
    id: "assessments-resume-id",
    name: "My assessments — edit links include application id",
    ok: read("app/applicant/assessments/page.tsx").includes("applicationId="),
  },
  {
    id: "email-sharing-link",
    name: "Email deep link points to introductions not sharing page",
    ok: read("lib/email/vars.ts").includes("view=introductions"),
  },
  {
    id: "pb-custom-steps",
    name: "Private banking custom steps component",
    ok: read("components/questionnaire/private-banking/PrivateBankingSteps.tsx").includes(
      "What would you like the bank to provide?"
    ),
  },
  {
    id: "pb-personal-details",
    name: "Personal details — name, surname, email, country shortcuts",
    ok: hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
      "Tell us about yourself",
      "I also live in",
      "I am also tax resident in",
    ]),
  },
  {
    id: "pb-asset-bands",
    name: "Liquid asset EUR bands per spec",
    ok: read("lib/questionnaire/private-banking-config.ts").includes("€50,000 to under €100,000"),
  },
  {
    id: "pb-no-timeline",
    name: "Removed preferred bank country / start timeline from PB UI",
    ok:
      !read("components/questionnaire/private-banking/PrivateBankingSteps.tsx").includes("pb-timeline") &&
      !read("components/questionnaire/private-banking/PrivateBankingSteps.tsx").includes("pb-bank-country"),
  },
  {
    id: "pb-background-funding",
    name: "Background & funding — wealth and fund sources",
    ok: read("components/questionnaire/private-banking/PrivateBankingSteps.tsx").includes(
      "How was your wealth accumulated?"
    ),
  },
  {
    id: "pb-expected-activity",
    name: "Expected account activity — third party and regular transfers",
    ok: hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
      "Do you expect regular incoming or outgoing transfers?",
      "Purpose of regular transfers",
    ]),
  },
  {
    id: "pb-summary-cards",
    name: "Assessment summary cards for private banking",
    ok: read("components/questionnaire/private-banking/PrivateBankingSummary.tsx").includes("Personal details"),
  },
  {
    id: "pb-build-typed",
    name: "buildTypedData uses PB service catalogue keys",
    ok: read("lib/questionnaire/buildTypedData.ts").includes("PB_SERVICES"),
  },
];

let passed = 0;
const failed = [];

for (const c of checks) {
  const ok = typeof c.ok === "boolean" ? c.ok : c.ok;
  if (ok) passed++;
  else failed.push({ id: c.id, name: c.name });
}

const total = checks.length;
console.log(JSON.stringify({ total, passed, failed: failed.length, failedItems: failed }, null, 2));
process.exit(failed.length ? 1 : 0);
