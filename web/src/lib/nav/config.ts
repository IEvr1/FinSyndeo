import type { NavItem } from "@/components/PlatformShell";

/** Sidebar labels match `FinSyndeo Guidelines/prototype/platform.js`. */
export const APPLICANT_NAV: NavItem[] = [
  { href: "/applicant", label: "Dashboard" },
  { href: "/applicant/find", label: "Find a Provider" },
  { href: "/applicant/assessments", label: "My assessments" },
  { href: "/applicant/results", label: "Results & introductions" },
  { href: "/applicant/alerts", label: "Match notifications" },
  { href: "/applicant/sharing", label: "Sharing permissions" },
  { href: "/applicant/privacy", label: "Account & data" },
];

export const PROVIDER_NAV: NavItem[] = [
  { href: "/provider", label: "Dashboard" },
  { href: "/provider/profile", label: "Institution profile" },
  { href: "/provider/preferences", label: "Reporting preferences" },
  { href: "/provider/reports", label: "Referred cases & reports" },
  { href: "/provider/privacy", label: "Sign-in & data settings" },
];

/** Unified platform nav; sign-in replaces prototype “Invited sign-in”. */
export const INTRODUCER_NAV: NavItem[] = [
  { href: "/introducer", label: "Dashboard" },
  { href: "/introducer/referrals", label: "My referrals" },
  { href: "/introducer/ledger", label: "Commission ledger" },
  { href: "/introducer/invoice", label: "Upload invoice" },
  { href: "/introducer/payments", label: "Payments & reconciliation" },
  { href: "/introducer/documents", label: "My Documents" },
  { href: "/introducer/privacy", label: "Account & data" },
];

/** Admin groups and labels match `platform.js` admin nav; country policy from spec addendum. */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", group: "Daily operations" },
  { href: "/admin/cases", label: "Prospects & assessments", group: "Daily operations" },
  { href: "/admin/diligence", label: "Due diligence & client file", group: "Daily operations" },
  { href: "/admin/providers", label: "Providers & approvals", group: "Providers and matching" },
  { href: "/admin/provider-terms", label: "Provider commercial terms", group: "Providers and matching" },
  { href: "/admin/matching", label: "Matching criteria", group: "Providers and matching" },
  { href: "/admin/country-policy", label: "Country acceptance", group: "Providers and matching" },
  { href: "/admin/intro-overview", label: "Introducer overview & tiers", group: "Introducers and accounting" },
  { href: "/admin/introducers", label: "Introducers", group: "Introducers and accounting" },
  { href: "/admin/intro-providers", label: "Introducer provider access", group: "Introducers and accounting" },
  { href: "/admin/clients", label: "Clients & relationships", group: "Introducers and accounting" },
  { href: "/admin/receipts", label: "Provider commissions", group: "Introducers and accounting" },
  { href: "/admin/invoices", label: "Invoices & payments", group: "Introducers and accounting" },
  { href: "/admin/accounting-reports", label: "Accounting reports", group: "Introducers and accounting" },
  { href: "/admin/introduction-settings", label: "Introduction & pricing", group: "Controls and notifications" },
  { href: "/admin/entitlements", label: "Entitlements & decisions", group: "Controls and notifications" },
  { href: "/admin/report-controls", label: "Report controls", group: "Controls and notifications" },
  { href: "/admin/ratings", label: "External ratings", group: "Controls and notifications" },
  { href: "/admin/payment-ledger", label: "Applicant payment ledger", group: "Controls and notifications" },
  { href: "/admin/notifications", label: "Notification history", group: "Controls and notifications" },
  { href: "/admin/unresolved", label: "Unresolved particulars", group: "Controls and notifications" },
  { href: "/admin/privacy", label: "Privacy requests", group: "Controls and notifications" },
  { href: "/admin/users", label: "Users & invitations", group: "Controls and notifications" },
  { href: "/admin/screening", label: "Screening health", group: "Controls and notifications" },
  { href: "/admin/audit", label: "Introduction audit trail", group: "Audit history" },
  { href: "/admin/intro-audit", label: "Introducer audit trail", group: "Audit history" },
  { href: "/admin/platform-activity", label: "Platform activity", group: "Audit history" },
];
