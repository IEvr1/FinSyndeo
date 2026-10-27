import countries from "@/data/countries.json";

export const PROVIDER_COUNTRIES = countries;

export const EU = [
  "Austria",
  "Belgium",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Ireland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Poland",
  "Portugal",
  "Romania",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
];

export const STATUS_OPTIONS: Array<[string, string]> = [
  ["unknown", "Not confirmed"],
  ["yes", "Accepted"],
  ["review", "Restricted / conditional"],
  ["edd", "Restricted / conditional (enhanced due diligence)"],
  ["no", "Prohibited"],
];

/** Stable payment-route catalogue (currency + rail). Currency alone does not imply a route. */
export const PAYMENT_ROUTES: Array<{ id: string; currency: string; label: string }> = [
  { id: "eur_sepa", currency: "EUR", label: "EUR SEPA credit transfers" },
  { id: "eur_sepa_instant", currency: "EUR", label: "EUR SEPA Instant" },
  { id: "eur_swift", currency: "EUR", label: "EUR international transfers via SWIFT" },
  { id: "eur_target", currency: "EUR", label: "EUR payments through TARGET / T2" },
  { id: "gbp_fps", currency: "GBP", label: "GBP Faster Payments (FPS)" },
  { id: "gbp_chaps", currency: "GBP", label: "GBP CHAPS" },
  { id: "gbp_swift", currency: "GBP", label: "GBP SWIFT" },
  { id: "usd_ach", currency: "USD", label: "USD ACH" },
  { id: "usd_fedwire", currency: "USD", label: "USD Fedwire" },
  { id: "usd_swift", currency: "USD", label: "USD SWIFT" },
];

export const BANK_ACCOUNT_OFFERINGS = [
  "Operating / commercial bank accounts",
  "Dedicated client-funds / safeguarding accounts",
] as const;

export const AGREEMENT_STATUS_OPTIONS = [
  "Signed and current",
  "Signed — status needs confirmation",
  "In progress",
  "Not yet arranged",
] as const;

export const FAMILIES: Record<string, string> = {
  bank: "Business bank accounts",
  merchant: "Merchant accounts",
  private: "Private banking",
  finance: "Financing",
  correspondent: "Correspondent / payment accounts",
};

export const FAMILY_ORDER = ["bank", "merchant", "private", "finance", "correspondent"] as const;

export const INSTITUTION_TYPES = [
  "Commercial bank",
  "Private bank",
  "Commercial & private bank",
  "Electronic money institution (EMI)",
  "Payment institution",
  "Payment service provider (PSP)",
  "Money services business (MSB)",
  "Crypto-asset service provider (CASP)",
  "Investment firm",
  "Lender / financing provider",
  "Other — please specify",
];

export const MERCHANT_CRYPTO_SERVICES = [
  "Fiat-to-crypto purchases (on-ramp)",
  "Crypto-to-fiat sales (off-ramp)",
  "Crypto payments accepted from customers",
  "Settlement to merchants in crypto",
];

export const SERVICES: Record<string, string[]> = {
  bank: [
    "Operating / commercial bank accounts",
    "Dedicated client-funds / safeguarding accounts",
    "Fixed-term deposits",
    "Automated payroll / bulk salary payments",
    "Overdraft facilities",
    "Foreign exchange (FX)",
    "Corporate cards",
    "Trade finance",
    "Letters of credit (LCs)",
    "Letters of guarantee (LGs)",
    "Lombard loans / lending against pledged financial assets",
    "Other — please specify",
  ],
  merchant: [
    "Online card payments",
    "In-person card payments / POS",
    "Alternative payment methods (APMs)",
    "Local payment methods in local currencies",
    ...MERCHANT_CRYPTO_SERVICES,
  ],
  private: [
    "Personal banking accounts",
    "Corporate banking accounts",
    "Savings / fixed-term deposits",
    "Foreign exchange (FX)",
    "Investment advisory services",
    "Discretionary portfolio management",
    "Securities custody",
    "Securities trading / execution",
    "Lombard loans / lending against pledged financial assets",
    "Payment cards",
    "Other — please specify",
  ],
  finance: [
    "Business loans / working-capital finance",
    "Revolving credit / overdraft facilities",
    "Equipment finance / leasing",
    "Property finance",
    "Project finance",
    "Maritime / vessel finance",
    "Trade finance",
    "Letters of credit (LCs)",
    "Letters of guarantee (LGs)",
    "Invoice finance / factoring",
    "Acquisition finance",
    "Refinancing",
    "Lombard loans / lending against pledged financial assets",
    "Other — please specify",
  ],
  correspondent: [
    "API connectivity",
    "Bulk payments",
    "Currency conversion and FX",
    "Cross border collection and payouts",
    "Payment clearing and settlement",
    "Banking as a Service (BaaS)",
    "White Label",
    "Card issuing",
    "Crypto on ramp (fiat to crypto)",
    "Crypto off ramp (crypto to fiat)",
    "Safeguarding of client funds",
    "Fixed term deposits (institution own funds)",
    "Other",
  ],
};

export const BAAS_DESCRIPTION =
  "Banking or payment capabilities supplied to other businesses through an integration or platform. BaaS is not synonymous with a correspondent account and does not automatically include SWIFT, SEPA, cards or third-party fund holding.";

/** Main fiat currencies — CHF removed from shared main pickers (CO06 / M06). */
export const CURRENCY_OPTIONS = ["EUR", "GBP", "USD"];

/** Merchant processing alone may name an additional ISO fiat currency. */
export const MERCHANT_CURRENCY_OPTIONS = ["EUR", "GBP", "USD", "Other"];

export function servicesLegend(family: string): string {
  switch (family) {
    case "bank":
      return "Banking facilities currently available";
    case "merchant":
      return "Merchant payment services currently available";
    case "private":
      return "Private banking services currently available";
    case "finance":
      return "Financing facilities currently available";
    case "correspondent":
      return "Services currently available to financial institutions";
    default:
      return "Services currently available";
  }
}

export function currenciesLegend(family: string): string {
  switch (family) {
    case "merchant":
      return "Payment acceptance currencies";
    case "finance":
      return "Financing currencies";
    case "private":
      return "Available account currencies";
    default:
      return "Available currencies";
  }
}

export const ONBOARDING_METHODS = [
  "Remote — online identity verification",
  "Remote — recorded video identification",
  "Remote — live video interview",
  "In-person onboarding",
  "Other — please specify",
];

export const REFERRAL_METHODS = [
  "Email introduction",
  "Referral link — applicant completes the application",
  "Introducer portal — SOPHIMA submits on the applicant's behalf",
  "Provider pre-approval form",
  "Other — please specify",
];

export const REFERRAL_ATTRIBUTION = [
  "Written acknowledgement by email",
  "Unique SOPHIMA referral link / code",
  "Recorded through the introducer portal",
  "Other — please specify",
];

export const INDUSTRIES = [
  "Agriculture & food production",
  "Construction & engineering",
  "Consulting & professional services",
  "Crypto-asset services — exchange, custody or brokerage",
  "E-commerce & retail",
  "Education & training",
  "Energy & utilities",
  "Financial services & fintech",
  "Forex brokerage & CFD dealing",
  "Healthcare & pharmaceuticals",
  "Holding & investment companies",
  "Hospitality & tourism",
  "Import, export & wholesale trade",
  "Manufacturing",
  "Marketing, media & entertainment",
  "Gambling & betting — real-money wagering",
  "Real estate",
  "Shipping, transport & logistics",
  "Software, IT & telecommunications",
  "Video games & esports — no gambling or wagering",
  "Blockchain / crypto software development — no customer asset services",
  "Other",
  "Adult industry",
];

export const ENTITY_TYPES = [
  "Private limited company (Ltd / LLC or equivalent)",
  "Public limited company (PLC or equivalent)",
  "Partnership",
  "Limited liability partnership (LLP)",
  "Association",
  "Foundation",
  "Other legal entity",
];

export const CORPORATE_ACCOUNT_AVAILABILITY = [
  "Offered without requiring a UBO personal account",
  "Offered only if a UBO first opens a personal account",
  "Case-by-case",
];

export const STEP_ORDER = [0, 1, 2, 3, 5, 7, 8] as const;

export const STEP_LABELS = [
  "Institution",
  "Authorisation",
  "Products",
  "Eligibility",
  "Payments & onboarding",
  "Partnership",
  "Review",
] as const;

export const STEP_TITLES = [
  "Your institution",
  "Authorisation & operating entities",
  "What can you offer?",
  "Which clients can you support?",
  "Payments, limits & onboarding",
  "Working with SOPHIMA",
  "Review your provider profile",
] as const;

export const STEP_LEADS = [
  "Help SOPHIMA understand your institution and verify the referral relationship.",
  "Identify the current authorisations supporting your products.",
  "Enter common details once. Separate products where eligibility or terms differ.",
  "Record one shared industry and country acceptance policy for the selected services.",
  "Enter common onboarding and payment limits once across selected account services.",
  "Define the referral process, benefits and confirmations.",
  "Confirm or edit your information before SOPHIMA review.",
] as const;

export const DRAFT_STORAGE_KEY = "finsyndeo-whole-review-provider-draft-v1";
