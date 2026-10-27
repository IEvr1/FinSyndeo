import type { NavItem } from "@/components/PlatformShell";

/** Sidebar labels aligned with SOPHIMA AI Visual Reference. */
export const APPLICANT_NAV: NavItem[] = [
  { href: "/applicant", label: "Dashboard" },
  { href: "/applicant/find", label: "Find a Provider" },
  { href: "/applicant/assessments", label: "My assessments" },
  { href: "/applicant/results", label: "Results & introductions" },
  { href: "/applicant/alerts", label: "Match notifications" },
  { href: "/applicant/privacy", label: "Sign-in & data settings" },
];

export const PROVIDER_NAV: NavItem[] = [
  { href: "/provider", label: "Dashboard" },
  { href: "/provider/profile", label: "Institution Profile" },
  { href: "/provider/reports", label: "Referred Cases & Reports" },
  { href: "/provider/preferences", label: "Reporting Preferences" },
  { href: "/provider/privacy", label: "Sign-in & data settings" },
];

/** Existing introducer routes; labels match Visual Reference. */
export const INTRODUCER_NAV: NavItem[] = [
  { href: "/introducer", label: "Dashboard" },
  { href: "/introducer/referrals", label: "My referrals" },
  { href: "/introducer/ledger", label: "My commissions" },
  { href: "/introducer/payments", label: "Invoices & payments" },
  { href: "/introducer/documents", label: "My documents" },
  { href: "/introducer/privacy", label: "Sign-in & data settings" },
];

/**
 * Full admin environment retained (permissions/audit unchanged).
 * Group labels support the Visual Reference “one integrated Admin” appearance.
 */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", group: "Daily operations" },
  { href: "/admin/cases", label: "Applicants & assessments", group: "Daily operations" },
  { href: "/admin/diligence", label: "Due diligence & client file", group: "Daily operations" },
  { href: "/admin/providers", label: "Providers", group: "Providers and matching" },
  { href: "/admin/provider-terms", label: "Provider commercial terms", group: "Providers and matching" },
  { href: "/admin/matching", label: "Matching criteria", group: "Providers and matching" },
  { href: "/admin/country-policy", label: "Country acceptance", group: "Providers and matching" },
  { href: "/admin/intro-overview", label: "Introducers", group: "Introducers and accounting" },
  { href: "/admin/introducers", label: "Introducer accounts", group: "Introducers and accounting" },
  { href: "/admin/intro-providers", label: "Introducer provider access", group: "Introducers and accounting" },
  { href: "/admin/clients", label: "Clients & relationships", group: "Introducers and accounting" },
  { href: "/admin/receipts", label: "Commissions", group: "Introducers and accounting" },
  { href: "/admin/invoices", label: "Invoices & payments", group: "Introducers and accounting" },
  { href: "/admin/accounting-reports", label: "Reports", group: "Introducers and accounting" },
  { href: "/admin/introduction-settings", label: "Introductions", group: "Controls and notifications" },
  { href: "/admin/entitlements", label: "Entitlements & decisions", group: "Controls and notifications" },
  { href: "/admin/report-controls", label: "Report controls", group: "Controls and notifications" },
  { href: "/admin/ratings", label: "External ratings", group: "Controls and notifications" },
  { href: "/admin/payment-ledger", label: "Applicant payment ledger", group: "Controls and notifications" },
  { href: "/admin/notifications", label: "Notification history", group: "Controls and notifications" },
  { href: "/admin/unresolved", label: "Unresolved particulars", group: "Controls and notifications" },
  { href: "/admin/privacy", label: "Privacy requests", group: "Controls and notifications" },
  { href: "/admin/users", label: "Users & invitations", group: "Controls and notifications" },
  { href: "/admin/screening", label: "Screening health", group: "Controls and notifications" },
  { href: "/admin/audit", label: "Audit history", group: "Audit history" },
  { href: "/admin/intro-audit", label: "Introducer audit trail", group: "Audit history" },
  { href: "/admin/platform-activity", label: "Platform activity", group: "Audit history" },
];
