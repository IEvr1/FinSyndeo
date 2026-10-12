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
  ["yes", "Supported"],
  ["review", "Case-by-case"],
  ["no", "Not supported"],
];

export const FAMILIES: Record<string, string> = {
  bank: "Business bank accounts",
  merchant: "Merchant accounts",
  private: "Private banking",
  finance: "Financing",
  correspondent: "Correspondent / payment accounts",
};

export const SERVICES: Record<string, string[]> = {
  bank: [
    "Operational activities — customer receipts and business payments",
    "Diversification of assets",
    "Backup / reserve account",
    "Escrow",
    "Trade finance",
    "Automated payroll",
    "Corporate cards",
    "Currency exchange (FX)",
    "Fixed-term deposits",
  ],
  merchant: [
    "Online card acquiring",
    "In-person card payments / POS",
    "Online and in-person acquiring",
    "Alternative payment methods (APMs)",
    "Customers buying crypto with fiat (on-ramp)",
    "Customers selling crypto for fiat (off-ramp)",
    "Accepting crypto payments",
    "Crypto settlement",
  ],
  private: [
    "Safekeeping and diversification",
    "Savings / term deposits",
    "Investment advice",
    "Managed investment portfolio",
    "Securities custody / trading",
    "Lending against investments",
  ],
  finance: [
    "Working capital",
    "Business expansion",
    "Equipment or asset purchase",
    "Property acquisition or development",
    "Project finance",
    "Trade or inventory finance",
    "Refinancing existing borrowing",
    "Business acquisition",
  ],
  correspondent: [
    "Operational account — own funds",
    "Dedicated client-funds account",
    "Dedicated virtual IBANs for clients",
    "Pooled / omnibus collection",
    "API connectivity",
    "SEPA / SEPA Instant",
    "Bulk payments",
    "FX conversion",
    "Client-funds safeguarding / segregation",
    "Collection and payout services",
    "Cross-border payments",
    "Clearing / settlement",
  ],
};

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

export const INSTITUTION_TYPES = [
  "Bank",
  "Electronic money institution (EMI)",
  "Payment institution / PSP",
  "Money services business (MSB)",
  "Crypto-asset service provider (CASP)",
  "Other",
];

export const RISK_CATEGORIES = [
  "Startups with no transaction history",
  "Holding companies / limited operating substance",
  "PEPs or connected persons",
  "Complex / multi-layer ownership",
  "Legal-entity shareholders",
  "Listed companies",
  "Groups seeking several accounts",
  "Non-EU parent with EU subsidiary / payment agent",
  "Third-party funds",
  "Crypto-related funds or customers",
  "Higher-risk country exposure — where legally permitted",
];

export const STEP_ORDER = [0, 1, 2, 3, 5, 7, 8] as const;

export const STEP_LABELS = [
  "Institution",
  "Authorisation",
  "Products",
  "Eligibility",
  "Product terms",
  "Partnership",
  "Review",
] as const;

export const STEP_TITLES = [
  "Your institution",
  "Authorisation & operating entities",
  "What can you offer?",
  "Which clients can you support?",
  "Product capabilities & limits",
  "Working with SOPHIMA",
  "Your provider profile",
] as const;

export const STEP_LEADS = [
  "Help SOPHIMA understand your institution and verify the referral relationship.",
  "Identify the current authorisations supporting your products.",
  "Enter common details once. Separate products where eligibility or terms differ.",
  "Record your current acceptance policy for this product.",
  "Only the questions relevant to the selected product appear.",
  "Define the referral process, benefits and future plans.",
  "Confirm or edit your information before SOPHIMA review.",
] as const;

export const DRAFT_STORAGE_KEY = "finsyndeo-whole-review-provider-draft-v1";
