import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const membershipRoleEnum = pgEnum("membership_role", [
  "applicant",
  "provider",
  "introducer",
  "admin",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "confirmed",
  "matching",
  "clarification",
  "screening_hold",
  "policy_exclusion",
  "institution_selected",
  "sharing_authorised",
  "introduction_sent",
  "closed",
  "withdrawn",
]);

export const documentClassificationEnum = pgEnum("document_classification", [
  "internal_original",
  "internal_extracted",
  "institution_profile",
  "internal_dd_report",
  "introducer_safe",
  "signed_evidence",
]);

export const screeningStatusEnum = pgEnum("screening_status", [
  "not_run",
  "not_enabled",
  "checked_no_match",
  "possible_match",
  "false_positive_resolved",
  "confirmed_restriction",
  "policy_exclusion",
  "provider_policy_mismatch",
  "unavailable",
  "stale",
]);

export const outboxStateEnum = pgEnum("outbox_state", [
  "pending",
  "blocked",
  "sent",
  "failed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull(),
    providerId: uuid("provider_id"),
    introducerId: uuid("introducer_id"),
    invited: boolean("invited").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("membership_user_role_idx").on(t.userId, t.role, t.providerId, t.introducerId)]
);

export const canonicalClients = pgTable("canonical_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  identityType: text("identity_type").notNull(), // person | entity
  identityKey: text("identity_key").notNull().unique(),
  displayName: text("display_name").notNull(),
  introducerId: uuid("introducer_id"),
  referralToken: text("referral_token"),
  freeIntroductionsUsed: integer("free_introductions_used").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => canonicalClients.id),
    route: text("route").notNull(),
    status: applicationStatusEnum("status").notNull().default("draft"),
    currentRevisionId: uuid("current_revision_id"),
    schemaVersion: text("schema_version").notNull().default("1"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("applications_owner_idx").on(t.ownerUserId), index("applications_client_idx").on(t.clientId)]
);

export const assessmentRevisions = pgTable(
  "assessment_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    typedData: jsonb("typed_data").notNull(),
    validationOutcome: jsonb("validation_outcome"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedByUserId: uuid("confirmed_by_user_id"),
    contentHash: text("content_hash").notNull(),
    referralContext: jsonb("referral_context"),
    previousRevisionId: uuid("previous_revision_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("revision_app_number_idx").on(t.applicationId, t.revisionNumber)]
);

export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  legalName: text("legal_name").notNull(),
  country: text("country").notNull(),
  approved: boolean("approved").notNull().default(false),
  agreementSigned: boolean("agreement_signed").notNull().default(false),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const providerOfferRevisions = pgTable("provider_offer_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  revisionNumber: integer("revision_number").notNull(),
  profileData: jsonb("profile_data").notNull(),
  approvalStatus: text("approval_status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  reviewBy: timestamp("review_by", { withTimezone: true }),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matchSnapshots = pgTable("match_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  revisionId: uuid("revision_id")
    .notNull()
    .references(() => assessmentRevisions.id),
  results: jsonb("results").notNull(),
  eligibleCount: integer("eligible_count").notNull().default(0),
  conditionalCount: integer("conditional_count").notNull().default(0),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sharingApprovals = pgTable("sharing_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  revisionId: uuid("revision_id")
    .notNull()
    .references(() => assessmentRevisions.id),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id),
  institutionLegalName: text("institution_legal_name").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  purpose: text("purpose").notNull(),
  documentManifest: jsonb("document_manifest").notNull(),
  privacyNoticeVersion: text("privacy_notice_version").notNull(),
  approvedByUserId: uuid("approved_by_user_id").notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
});

export const screeningSources = pgTable("screening_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceKey: text("source_key").notNull().unique(),
  sourceUrl: text("source_url").notNull(),
  version: text("version"),
  integrityHash: text("integrity_hash"),
  retrievedAt: timestamp("retrieved_at", { withTimezone: true }),
  maxAgeHours: integer("max_age_hours").notNull().default(24),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
});

export const screeningRuns = pgTable("screening_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  revisionId: uuid("revision_id")
    .notNull()
    .references(() => assessmentRevisions.id),
  subjectId: text("subject_id").notNull(),
  scope: text("scope").notNull(),
  sourceVersions: jsonb("source_versions").notNull(),
  status: screeningStatusEnum("status").notNull().default("not_run"),
  candidateMatches: jsonb("candidate_matches"),
  resolutionEvidence: jsonb("resolution_evidence"),
  reviewerUserId: uuid("reviewer_user_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const countryPolicies = pgTable("country_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: integer("version").notNull(),
  group1Exclusions: jsonb("group1_exclusions").notNull().default([]),
  published: boolean("published").notNull().default(false),
  approvedBy: text("approved_by"),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerType: text("owner_type").notNull(),
  ownerId: uuid("owner_id").notNull(),
  classification: documentClassificationEnum("classification").notNull(),
  fileName: text("file_name").notNull(),
  storageKey: text("storage_key").notNull(),
  contentHash: text("content_hash").notNull(),
  mimeType: text("mime_type"),
  extractedText: text("extracted_text"),
  proposedRules: jsonb("proposed_rules"),
  linkedOriginalId: uuid("linked_original_id"),
  disclosureReviewReason: text("disclosure_review_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const introductionRequests = pgTable("introduction_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id),
  revisionId: uuid("revision_id")
    .notNull()
    .references(() => assessmentRevisions.id),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id),
  sharingApprovalId: uuid("sharing_approval_id").references(() => sharingApprovals.id),
  status: text("status").notNull().default("requested"),
  entitlementType: text("entitlement_type").notNull(),
  quoteSnapshot: jsonb("quote_snapshot"),
  paymentStatus: text("payment_status").notNull().default("not_required"),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  introductionRequestId: uuid("introduction_request_id")
    .notNull()
    .references(() => introductionRequests.id),
  gateway: text("gateway").notNull(),
  gatewayOrderId: text("gateway_order_id").notNull().unique(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  taxTreatment: text("tax_treatment"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  status: text("status").notNull().default("pending"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  webhookEvidence: jsonb("webhook_evidence"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const outboxEvents = pgTable("outbox_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: text("template_id").notNull(),
  templateVersion: text("template_version").notNull().default("1"),
  businessEvent: text("business_event").notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  revisionId: uuid("revision_id"),
  toAddresses: jsonb("to_addresses").notNull(),
  ccAddresses: jsonb("cc_addresses"),
  payload: jsonb("payload").notNull(),
  attachmentManifest: jsonb("attachment_manifest"),
  state: outboxStateEnum("state").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const introducers = pgTable("introducers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("invited"),
  referralToken: text("referral_token").notNull().unique(),
  linkSuspended: boolean("link_suspended").notNull().default(false),
  tierAchieved: integer("tier_achieved").notNull().default(0),
  bespokeRate: integer("bespoke_rate"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const commissionEntries = pgTable(
  "commission_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    introducerId: uuid("introducer_id")
      .notNull()
      .references(() => introducers.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => canonicalClients.id),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id),
    relationshipId: uuid("relationship_id"),
    receiptAllocationId: uuid("receipt_allocation_id"),
    statementLineId: text("statement_line_id"),
    grossMinor: integer("gross_minor").notNull(),
    netMinor: integer("net_minor").notNull(),
    shareMinor: integer("share_minor").notNull(),
    currency: text("currency").notNull(),
    ratePercent: integer("rate_percent").notNull(),
    termsSnapshot: jsonb("terms_snapshot").notNull(),
    supplierInvoiceAllocationId: uuid("supplier_invoice_allocation_id"),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
    reversedById: uuid("reversed_by_id"),
  },
  (t) => [
    uniqueIndex("commission_statement_line_idx").on(t.statementLineId),
    uniqueIndex("commission_receipt_allocation_idx").on(t.receiptAllocationId),
  ]
);

export const agreements = pgTable("agreements", {
  id: uuid("id").primaryKey().defaultRandom(),
  introducerId: uuid("introducer_id")
    .notNull()
    .references(() => introducers.id),
  agreementType: text("agreement_type").notNull(),
  version: text("version").notNull(),
  content: text("content").notNull(),
  contentHash: text("content_hash").notNull(),
  status: text("status").notNull().default("draft"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  acceptedByUserId: uuid("accepted_by_user_id"),
  hasUnresolvedPlaceholders: boolean("has_unresolved_placeholders").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const unresolvedParticulars = pgTable("unresolved_particulars", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  blocksActions: jsonb("blocks_actions").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: text("resolved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const providerPlannedItems = pgTable(
  "provider_planned_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    offerFamily: text("offer_family").notNull(),
    itemName: text("item_name").notNull(),
    launchTarget: text("launch_target"),
    comment: text("comment"),
    status: text("status").notNull().default("planned"),
    overdueFlaggedAt: timestamp("overdue_flagged_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("provider_planned_provider_idx").on(t.providerId)]
);

export const providerReportSnapshots = pgTable(
  "provider_report_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    periodLabel: text("period_label").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
    format: text("format").notNull().default("pdf"),
    storageKey: text("storage_key"),
  },
  (t) => [index("provider_report_provider_idx").on(t.providerId)]
);

export const providerRelationships = pgTable(
  "provider_relationships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => canonicalClients.id),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id),
    product: text("product").notNull(),
    status: text("status").notNull().default("submitted"),
    ddClear: boolean("dd_clear").notNull().default(false),
    evidence: jsonb("evidence"),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    financingFirstDisbursementAt: timestamp("financing_first_disbursement_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("provider_relationship_app_idx").on(t.applicationId),
    index("provider_relationship_client_idx").on(t.clientId),
  ]
);

export const providerStatements = pgTable("provider_statements", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id),
  statementReference: text("statement_reference").notNull(),
  periodLabel: text("period_label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const providerCashReceipts = pgTable(
  "provider_cash_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id),
    statementId: uuid("statement_id").references(() => providerStatements.id),
    bankReference: text("bank_reference").notNull(),
    currency: text("currency").notNull(),
    valueDate: timestamp("value_date", { withTimezone: true }).notNull(),
    verifiedCashMinor: integer("verified_cash_minor").notNull(),
    evidence: jsonb("evidence"),
    verifiedByUserId: uuid("verified_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("provider_cash_receipt_bank_ref_idx").on(t.bankReference)]
);

export const receiptAllocations = pgTable(
  "receipt_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    receiptId: uuid("receipt_id")
      .notNull()
      .references(() => providerCashReceipts.id, { onDelete: "cascade" }),
    statementLineId: text("statement_line_id").notNull(),
    relationshipId: uuid("relationship_id")
      .notNull()
      .references(() => providerRelationships.id),
    grossMinor: integer("gross_minor").notNull(),
    vatMinor: integer("vat_minor").notNull().default(0),
    withholdingMinor: integer("withholding_minor").notNull().default(0),
    chargesMinor: integer("charges_minor").notNull().default(0),
    taxMode: text("tax_mode").notNull(),
    expectedCashMinor: integer("expected_cash_minor").notNull(),
    eligibleNetMinor: integer("eligible_net_minor").notNull(),
    actualCashMinor: integer("actual_cash_minor").notNull(),
    holdReason: text("hold_reason"),
    commissionEntryId: uuid("commission_entry_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("receipt_allocation_line_idx").on(t.statementLineId)]
);

export const supplierInvoices = pgTable("supplier_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  introducerId: uuid("introducer_id")
    .notNull()
    .references(() => introducers.id),
  invoiceNumber: text("invoice_number").notNull(),
  currency: text("currency").notNull(),
  subtotalMinor: integer("subtotal_minor").notNull(),
  taxMinor: integer("tax_minor").notNull().default(0),
  totalMinor: integer("total_minor").notNull(),
  status: text("status").notNull().default("submitted"),
  documentId: uuid("document_id"),
  rejectedReason: text("rejected_reason"),
  priorInvoiceId: uuid("prior_invoice_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supplierInvoiceAllocations = pgTable(
  "supplier_invoice_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => supplierInvoices.id, { onDelete: "cascade" }),
    commissionEntryId: uuid("commission_entry_id")
      .notNull()
      .references(() => commissionEntries.id),
    amountMinor: integer("amount_minor").notNull(),
  },
  (t) => [uniqueIndex("supplier_invoice_entry_idx").on(t.commissionEntryId)]
);

export const supplierPayments = pgTable(
  "supplier_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => supplierInvoices.id),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    valueDate: timestamp("value_date", { withTimezone: true }).notNull(),
    bankReference: text("bank_reference").notNull(),
    status: text("status").notNull().default("recorded"),
    recordedByUserId: uuid("recorded_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("supplier_payment_bank_ref_idx").on(t.bankReference)]
);

export const privacyDataRequests = pgTable("privacy_data_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  providerId: uuid("provider_id").references(() => providers.id),
  requestType: text("request_type").notNull(),
  status: text("status").notNull().default("pending"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});
