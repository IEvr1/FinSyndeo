/**
 * Verification against FinSyndeo Changes for Applicant Private_v2.docx
 * Run: node scripts/verify-applicant-v2.mjs
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

function read(rel) {
  const p = join(src, rel);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf8");
}

function hasAll(rel, patterns) {
  const text = read(rel);
  return patterns.every((p) => (typeof p === "string" ? text.includes(p) : p.test(text)));
}

function hasNone(rel, patterns) {
  const text = read(rel);
  return patterns.every((p) => (typeof p === "string" ? !text.includes(p) : !p.test(text)));
}

/** @type {{ id: string, section: string, name: string, ok: boolean }[]} */
const checks = [
  // 1. Dashboard
  {
    id: "dash-heading",
    section: "1. Applicant dashboard",
    name: "Heading and shortened subtitle",
    ok: hasAll("app/applicant/ApplicantDashboard.tsx", [
      "Your FinSyndeo dashboard",
      "Find suitable providers and manage your applications",
    ]),
  },
  {
    id: "dash-cards",
    section: "1. Applicant dashboard",
    name: "Four dashboard cards with required CTAs",
    ok: hasAll("app/applicant/ApplicantDashboard.tsx", [
      "Start an assessment",
      "View my assessments",
      "View results",
      "Manage notifications",
      "Tell us what you need",
      "Continue or update your saved assessments",
    ]),
  },
  {
    id: "dash-continue",
    section: "1. Applicant dashboard",
    name: "Continue unfinished assessment + secondary new",
    ok: hasAll("app/applicant/ApplicantDashboard.tsx", [
      "Continue your assessment",
      "Start a new assessment",
      "Last saved",
    ]),
  },
  {
    id: "dash-nav-labels",
    section: "1. Applicant dashboard",
    name: "Sidebar My assessments + Sign-in & data settings; no Sharing permissions",
    ok:
      hasAll("lib/nav/config.ts", ["My assessments", "Sign-in & data settings", "Match notifications"]) &&
      !read("lib/nav/config.ts").includes("Sharing permissions"),
  },

  // 2. Find a provider
  {
    id: "find-copy",
    section: "2. Find a provider",
    name: "Heading, subtitle, two route cards",
    ok: hasAll("app/applicant/find/page.tsx", [
      "Tell us about your needs",
      "Complete your assessment yourself or with AI guidance",
      "Start questionnaire",
      "Start with AI guidance",
      "typed guidance",
    ]),
  },
  {
    id: "find-no-account-list",
    section: "2. Find a provider",
    name: "No account-type list / Voice when configured",
    ok: hasNone("app/applicant/find/page.tsx", ["Merchant account", "Financing", "Voice when configured"]),
  },
  {
    id: "guided-parity",
    section: "2. Find a provider",
    name: "AI-guided uses same QuestionnaireWizard + draft",
    ok: hasAll("app/applicant/guided/page.tsx", ["QuestionnaireWizard", "guidedMode"]),
  },

  // 3. Questionnaire start
  {
    id: "q-start",
    section: "3. Questionnaire start",
    name: "Start heading, Privacy Notice ack, Discard draft",
    ok: hasAll("components/QuestionnaireWizard.tsx", [
      "Start your assessment",
      "I have read the",
      "Privacy Notice",
      "Discard this draft",
      "/legal/privacy",
    ]),
  },
  {
    id: "q-server-save",
    section: "3. Questionnaire start",
    name: "Progress saved only after server save path",
    ok:
      hasAll("components/QuestionnaireWizard.tsx", [
        "serverSaved",
        "/api/applications",
        "wizardDraft",
        "Progress saved",
      ]) && !read("components/QuestionnaireWizard.tsx").includes("from this device"),
  },
  {
    id: "q-no-field-dict",
    section: "3. Questionnaire start",
    name: "No approved field dictionary wording",
    ok: !read("components/QuestionnaireWizard.tsx").includes("approved field dictionary"),
  },

  // 4. Applicant type
  {
    id: "type-cards",
    section: "4. Applicant type & navigation",
    name: "Individual / Legal entity / FI cards + LE services",
    ok: hasAll("components/questionnaire/ApplicantRouteSelector.tsx", [
      "Individual",
      "Legal entity",
      "Financial institution",
      "Business bank account",
      "Merchant account",
      "Both bank and merchant accounts",
      "Financing",
      "Change applicant type",
    ]),
  },
  {
    id: "type-change-on-pb",
    section: "4. Applicant type & navigation",
    name: "Change applicant type available on PB steps",
    ok: hasAll("components/QuestionnaireWizard.tsx", ["changeApplicantType", "Change applicant type"]),
  },
  {
    id: "entity-labels",
    section: "4. Applicant type & navigation",
    name: "Entity details + Ownership & control labels",
    ok: hasAll("lib/questionnaire/step-meta.ts", ["Entity details", "Ownership & control", "Your assessment summary"]),
  },

  // 5–6 Individual route / hide entity
  {
    id: "indiv-flow",
    section: "5. Individual private-banking route",
    name: "PB flow excludes Company/Contact; includes PB steps + summary",
    ok: read("lib/questionnaire/flows.ts").includes("[0, 1, 20, 21, 22, 23, 40]"),
  },
  {
    id: "indiv-hide-entity",
    section: "6. Entity fields hidden for individual",
    name: "Visibility rules hide entity for individual",
    ok: read("lib/questionnaire/visibility.ts").includes('applicant === "individual"'),
  },
  {
    id: "pb-step-titles",
    section: "5. Individual private-banking route",
    name: "PB step titles renamed",
    ok: hasAll("lib/questionnaire/step-meta.ts", [
      "Your private banking needs",
      "Your background & funding",
      "Expected account activity",
    ]),
  },

  // 7. Personal details
  {
    id: "pd-fields",
    section: "7. Personal details",
    name: "Name, surname, email, shortcuts, tax hint",
    ok: hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
      "Tell us about yourself",
      "Contact email",
      "I also live in",
      "I am also tax resident in",
      "Select all countries where you are tax resident",
      "pb-shortcut-live-country",
      "pb-shortcut-tax-country",
    ]),
  },
  {
    id: "pd-countries",
    section: "7. Personal details",
    name: "Country catalogue: no regions; South Korea present",
    ok: (() => {
      const c = read("data/countries.json");
      return (
        !c.includes('"Europe"') &&
        !c.includes('"Latin America"') &&
        !c.includes('"Korea"') &&
        c.includes('"South Korea"') &&
        c.includes('"North Korea"')
      );
    })(),
  },
  {
    id: "pd-email-prefill",
    section: "7. Personal details",
    name: "Contact email can prefill from session",
    ok: hasAll("components/QuestionnaireWizard.tsx", ["/api/auth/session", "pb-email"]),
  },

  // 8–9 PB needs
  {
    id: "pb-services",
    section: "8. Private banking needs",
    name: "Service catalogue + Required/Preferred explanation",
    ok: hasAll("lib/questionnaire/private-banking-config.ts", [
      "Personal banking account",
      "Securities custody",
      "Securities trading / execution",
      "Lombard loan",
    ]) &&
      hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
        "What would you like the bank to provide?",
        "Required services determine eligibility",
        "Anything else you would like us to consider?",
      ]),
  },
  {
    id: "pb-assets",
    section: "8. Private banking needs",
    name: "EUR liquid-asset bands",
    ok: hasAll("lib/questionnaire/private-banking-config.ts", [
      "€50,000 to under €100,000",
      "Above €5 million",
    ]),
  },
  {
    id: "pb-no-timeline",
    section: "9. Private banking needs continued",
    name: "No start timeline / preferred bank country in PB UI",
    ok: hasNone("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
      "pb-timeline",
      "pb-bank-country",
      "When would you like to start",
      "Preferred bank country",
    ]),
  },
  {
    id: "pb-currencies",
    section: "9. Private banking needs continued",
    name: "Account currencies + Other level toggle",
    ok: (() => {
      const t = read("components/questionnaire/private-banking/PrivateBankingSteps.tsx");
      return (
        t.includes("Which account currencies do you need?") &&
        t.includes("curr-${code}") &&
        !t.includes('on && code !== "Other"')
      );
    })(),
  },

  // 10 Background & funding
  {
    id: "pb-funding",
    section: "10. Background & funding",
    name: "Wealth vs fund sources; occupation rename",
    ok: hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
      "How was your wealth accumulated?",
      "What is the source of the money you intend to place with the bank?",
      "Occupation / business activity",
      "Original source of existing savings",
    ]),
  },
  {
    id: "pb-typed-origins",
    section: "10. Background & funding",
    name: "Typed data includes fund-origin and transfer purposes",
    ok: hasAll("lib/questionnaire/buildTypedData.ts", [
      "existingSavingsOrigin",
      "transferPurposes",
      "PB_TRANSFER_PURPOSES",
    ]),
  },

  // 11–12 Expected activity
  {
    id: "pb-activity",
    section: "11. Expected account activity",
    name: "Initial funding + regular transfers UI",
    ok: hasAll("components/questionnaire/private-banking/PrivateBankingSteps.tsx", [
      "Country / countries from which the initial transfer will be sent",
      "Do you expect regular incoming or outgoing transfers?",
      "Purpose of regular transfers",
      "Not yet known",
    ]),
  },
  {
    id: "pb-activity-validation",
    section: "12. Expected account activity lower",
    name: "Validation uses Incoming/Outgoing exact values + purposes",
    ok: hasAll("lib/questionnaire/validate-private-banking.ts", [
      'dir === "Incoming"',
      'dir === "Outgoing"',
      "purpose of regular transfers",
    ]),
  },

  // 13 Summary
  {
    id: "pb-summary",
    section: "13. Assessment summary",
    name: "Summary cards + Confirm & find potential matches",
    ok:
      hasAll("components/questionnaire/private-banking/PrivateBankingSummary.tsx", ["Personal details"]) &&
      hasAll("components/QuestionnaireWizard.tsx", [
        "Confirm & find potential matches",
        "accurate to the best of my knowledge",
      ]),
  },

  // 14 Contact removed
  {
    id: "contact-removed",
    section: "14. Remove Contact page",
    name: "Individual flow has no Contact step",
    ok:
      read("lib/questionnaire/flows.ts").includes("[0, 1, 20, 21, 22, 23, 40]") &&
      !read("lib/questionnaire/flows.ts").match(/individual.*\[0,\s*1,\s*20.*5/),
  },

  // 15 Results
  {
    id: "results-anon",
    section: "15. Potential providers",
    name: "Anonymous options, View solution, empty state",
    ok: hasAll("components/applicant/ResultsFlow.tsx", [
      "Provider option",
      "View solution",
      "We could not identify a suitable provider based on your current requirements",
      "Review my requirements",
      'm.status === "eligible"',
    ]),
  },
  {
    id: "results-fee",
    section: "15. Potential providers",
    name: "Fee uses allowance wording (not blanket Free)",
    ok:
      hasAll("components/applicant/ResultsFlow.tsx", ["Included in your introduction allowance"]) &&
      !/return requiresPayment \? .* : "Free"/.test(read("components/applicant/ResultsFlow.tsx")),
  },
  {
    id: "results-no-list-journey",
    section: "15. Potential providers",
    name: "No journey progress bar on main results list",
    ok: (() => {
      const t = read("components/applicant/ResultsFlow.tsx");
      const idx = t.indexOf("Your potential providers");
      const block = t.slice(idx, idx + 1200);
      return !block.includes("ClientJourneySteps");
    })(),
  },

  // 16 Review introduction
  {
    id: "review-intro",
    section: "16. Review & authorise introduction",
    name: "Review this provider option + combined approve action",
    ok: hasAll("components/applicant/ResultsFlow.tsx", [
      "Review this provider option",
      "Approve sharing & request introduction",
      "I authorise SOPHIMA to share the client profile",
      "Preview the information to be shared",
      "approveSharingAndRequest",
    ]),
  },

  // 17 Compare
  {
    id: "compare",
    section: "17. Compare selected solutions",
    name: "Compare heading/subtitle and View solution CTA",
    ok: hasAll("components/applicant/ResultsFlow.tsx", [
      "Compare your selected solutions",
      "Compare services, requirements and conditions before choosing a provider",
    ]),
  },

  // 18–19 Introductions
  {
    id: "intros-copy",
    section: "18. My introductions",
    name: "Heading, allowance summary, empty state",
    ok: hasAll("components/applicant/ResultsFlow.tsx", [
      "Track your introduction requests",
      "Included introductions remaining",
      "No introductions requested yet. Review your potential providers",
      "View potential providers",
    ]),
  },
  {
    id: "intros-detail",
    section: "19. My introductions pending",
    name: "View request + Information sharing + Cancel",
    ok: hasAll("components/applicant/ResultsFlow.tsx", [
      "View request",
      "Information sharing",
      "Cancel request",
      "INT-",
      "Introduction requested — release checks pending",
    ]),
  },
  {
    id: "intros-no-bar",
    section: "18. My introductions",
    name: "No ClientJourneySteps on introductions list",
    ok: (() => {
      const block = read("components/applicant/ResultsFlow.tsx");
      const start = block.indexOf('if (view === "introductions")');
      const end = block.indexOf('if (view === "checkout"', start);
      return !block.slice(start, end).includes("ClientJourneySteps");
    })(),
  },

  // 20 Match notifications
  {
    id: "alerts-ui",
    section: "20. Match notifications",
    name: "Copy, thresholds, Save preferences",
    ok: hasAll("app/applicant/alerts/page.tsx", [
      "Match notifications",
      "Receive an email when a new provider matches",
      "70%",
      "100%",
      "Save preferences",
    ]),
  },
  {
    id: "alerts-persist",
    section: "20. Match notifications",
    name: "Preferences persisted via API",
    ok:
      hasAll("app/applicant/alerts/page.tsx", ["/api/applicants/match-preferences"]) &&
      existsSync(join(src, "app/api/applicants/match-preferences/route.ts")),
  },

  // 21 Sharing removed
  {
    id: "sharing-removed",
    section: "21. Remove Sharing permissions page",
    name: "Nav removed + redirect to introductions",
    ok:
      !read("lib/nav/config.ts").includes("Sharing permissions") &&
      hasAll("app/applicant/sharing/page.tsx", ['view", "introductions"']),
  },
  {
    id: "sharing-in-request",
    section: "21. Remove Sharing permissions page",
    name: "Sharing controls live under introduction request",
    ok: hasAll("components/applicant/ResultsFlow.tsx", ["Information sharing", "Preview information to be shared"]),
  },

  // 22 Sign-in & data
  {
    id: "privacy-sections",
    section: "22. Sign-in & data settings",
    name: "Three sections + close/delete separation",
    ok: (() => {
      const t = read("app/applicant/privacy/page.tsx");
      return (
        (t.includes("Sign-in & data settings") || t.includes("Sign-in &amp; data settings")) &&
        t.includes("Your sign-in") &&
        t.includes("Your information") &&
        t.includes("Download my information") &&
        t.includes("Close my sign-in") &&
        t.includes("Request deletion of my personal data") &&
        t.includes("Closing your sign-in and deleting personal data are separate actions") &&
        t.includes("/legal/privacy") &&
        t.includes("/legal/retention")
      );
    })(),
  },
  {
    id: "privacy-withdraw-assessments",
    section: "22. Sign-in & data settings",
    name: "Withdraw assessment under My assessments",
    ok: hasAll("app/applicant/assessments/page.tsx", ["Withdraw selected application", "applicationId="]),
  },
  {
    id: "legal-pages",
    section: "22. Sign-in & data settings",
    name: "Privacy Notice + retention pages exist",
    ok:
      existsSync(join(src, "app/legal/privacy/page.tsx")) &&
      existsSync(join(src, "app/legal/retention/page.tsx")) &&
      hasAll("app/legal/privacy/page.tsx", ["Assessment", "Matching", "Screening", "Sharing", "Retention"]),
  },

  // Cross-cutting
  {
    id: "brand",
    section: "Cross-cutting",
    name: "Brand colour #826A50",
    ok: hasAll("app/globals.css", ["#826a50"]),
  },
  {
    id: "email-intro-link",
    section: "Cross-cutting",
    name: "Email deep link to introductions",
    ok: read("lib/email/vars.ts").includes("view=introductions"),
  },
  {
    id: "app-get",
    section: "Cross-cutting",
    name: "GET application + revision for draft hydrate",
    ok: existsSync(join(src, "app/api/applications/[id]/route.ts")),
  },
];

const bySection = new Map();
let passed = 0;
const failed = [];

for (const c of checks) {
  if (c.ok) passed++;
  else failed.push({ id: c.id, section: c.section, name: c.name });
  const list = bySection.get(c.section) ?? { pass: 0, fail: 0 };
  if (c.ok) list.pass++;
  else list.fail++;
  bySection.set(c.section, list);
}

const sections = [...bySection.entries()].map(([section, s]) => ({
  section,
  passed: s.pass,
  failed: s.fail,
  total: s.pass + s.fail,
  status: s.fail === 0 ? "IMPLEMENTED" : s.pass === 0 ? "NOT IMPLEMENTED" : "PARTIAL",
}));

const report = {
  document: "FinSyndeo Changes for Applicant Private_v2.docx",
  total: checks.length,
  passed,
  failed: failed.length,
  percent: Math.round((passed / checks.length) * 100),
  sections,
  failedItems: failed,
};

console.log(JSON.stringify(report, null, 2));
process.exit(failed.length ? 1 : 0);
