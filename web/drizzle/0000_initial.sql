CREATE TYPE "membership_role" AS ENUM('applicant', 'provider', 'introducer', 'admin');
CREATE TYPE "application_status" AS ENUM('draft', 'confirmed', 'matching', 'clarification', 'screening_hold', 'policy_exclusion', 'institution_selected', 'sharing_authorised', 'introduction_sent', 'closed', 'withdrawn');
CREATE TYPE "document_classification" AS ENUM('internal_original', 'internal_extracted', 'institution_profile', 'internal_dd_report', 'introducer_safe', 'signed_evidence');
CREATE TYPE "screening_status" AS ENUM('not_run', 'not_enabled', 'checked_no_match', 'possible_match', 'false_positive_resolved', 'confirmed_restriction', 'policy_exclusion', 'provider_policy_mismatch', 'unavailable', 'stale');
CREATE TYPE "outbox_state" AS ENUM('pending', 'blocked', 'sent', 'failed', 'cancelled');

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean DEFAULT false NOT NULL,
  "name" text,
  "mfa_enabled" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "role" "membership_role" NOT NULL,
  "provider_id" uuid,
  "introducer_id" uuid,
  "invited" boolean DEFAULT false NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "canonical_clients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "identity_type" text NOT NULL,
  "identity_key" text NOT NULL UNIQUE,
  "display_name" text NOT NULL,
  "introducer_id" uuid,
  "referral_token" text,
  "free_introductions_used" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "client_id" uuid NOT NULL REFERENCES "canonical_clients"("id"),
  "route" text NOT NULL,
  "status" "application_status" DEFAULT 'draft' NOT NULL,
  "current_revision_id" uuid,
  "schema_version" text DEFAULT '1' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "assessment_revisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "applications"("id") ON DELETE cascade,
  "revision_number" integer NOT NULL,
  "typed_data" jsonb NOT NULL,
  "validation_outcome" jsonb,
  "confirmed_at" timestamptz,
  "confirmed_by_user_id" uuid,
  "content_hash" text NOT NULL,
  "referral_context" jsonb,
  "previous_revision_id" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "revision_app_number_idx" ON "assessment_revisions" ("application_id","revision_number");

CREATE TABLE IF NOT EXISTS "providers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL UNIQUE,
  "legal_name" text NOT NULL,
  "country" text NOT NULL,
  "approved" boolean DEFAULT false NOT NULL,
  "agreement_signed" boolean DEFAULT false NOT NULL,
  "active" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "provider_offer_revisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE cascade,
  "revision_number" integer NOT NULL,
  "profile_data" jsonb NOT NULL,
  "approval_status" text DEFAULT 'draft' NOT NULL,
  "published_at" timestamptz,
  "review_by" timestamptz,
  "effective_from" timestamptz,
  "valid_until" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "match_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "applications"("id") ON DELETE cascade,
  "revision_id" uuid NOT NULL REFERENCES "assessment_revisions"("id"),
  "results" jsonb NOT NULL,
  "eligible_count" integer DEFAULT 0 NOT NULL,
  "conditional_count" integer DEFAULT 0 NOT NULL,
  "computed_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sharing_approvals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "applications"("id") ON DELETE cascade,
  "revision_id" uuid NOT NULL REFERENCES "assessment_revisions"("id"),
  "provider_id" uuid NOT NULL REFERENCES "providers"("id"),
  "institution_legal_name" text NOT NULL,
  "recipient_email" text NOT NULL,
  "recipient_name" text,
  "purpose" text NOT NULL,
  "document_manifest" jsonb NOT NULL,
  "privacy_notice_version" text NOT NULL,
  "approved_by_user_id" uuid NOT NULL,
  "approved_at" timestamptz DEFAULT now() NOT NULL,
  "withdrawn_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "screening_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_key" text NOT NULL UNIQUE,
  "source_url" text NOT NULL,
  "version" text,
  "integrity_hash" text,
  "retrieved_at" timestamptz,
  "max_age_hours" integer DEFAULT 24 NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "error_message" text
);

CREATE TABLE IF NOT EXISTS "screening_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "applications"("id") ON DELETE cascade,
  "revision_id" uuid NOT NULL REFERENCES "assessment_revisions"("id"),
  "subject_id" text NOT NULL,
  "scope" text NOT NULL,
  "source_versions" jsonb NOT NULL,
  "status" "screening_status" DEFAULT 'not_run' NOT NULL,
  "candidate_matches" jsonb,
  "resolution_evidence" jsonb,
  "reviewer_user_id" uuid,
  "expires_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "country_policies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "version" integer NOT NULL,
  "group1_exclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "published" boolean DEFAULT false NOT NULL,
  "approved_by" text,
  "effective_from" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_type" text NOT NULL,
  "owner_id" uuid NOT NULL,
  "classification" "document_classification" NOT NULL,
  "file_name" text NOT NULL,
  "storage_key" text NOT NULL,
  "content_hash" text NOT NULL,
  "mime_type" text,
  "extracted_text" text,
  "proposed_rules" jsonb,
  "linked_original_id" uuid,
  "disclosure_review_reason" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "introduction_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "applications"("id"),
  "revision_id" uuid NOT NULL REFERENCES "assessment_revisions"("id"),
  "provider_id" uuid NOT NULL REFERENCES "providers"("id"),
  "sharing_approval_id" uuid REFERENCES "sharing_approvals"("id"),
  "status" text DEFAULT 'requested' NOT NULL,
  "entitlement_type" text NOT NULL,
  "quote_snapshot" jsonb,
  "payment_status" text DEFAULT 'not_required' NOT NULL,
  "released_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "introduction_request_id" uuid NOT NULL REFERENCES "introduction_requests"("id"),
  "gateway" text NOT NULL,
  "gateway_order_id" text NOT NULL UNIQUE,
  "amount_minor" integer NOT NULL,
  "currency" text NOT NULL,
  "tax_treatment" text,
  "idempotency_key" text NOT NULL UNIQUE,
  "status" text DEFAULT 'pending' NOT NULL,
  "verified_at" timestamptz,
  "webhook_evidence" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "outbox_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_id" text NOT NULL,
  "template_version" text DEFAULT '1' NOT NULL,
  "business_event" text NOT NULL,
  "idempotency_key" text NOT NULL UNIQUE,
  "revision_id" uuid,
  "to_addresses" jsonb NOT NULL,
  "cc_addresses" jsonb,
  "payload" jsonb NOT NULL,
  "attachment_manifest" jsonb,
  "state" "outbox_state" DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "sent_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "introducers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id"),
  "display_name" text NOT NULL,
  "email" text NOT NULL,
  "status" text DEFAULT 'invited' NOT NULL,
  "referral_token" text NOT NULL UNIQUE,
  "tier_achieved" integer DEFAULT 0 NOT NULL,
  "bespoke_rate" integer,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "commission_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "introducer_id" uuid NOT NULL REFERENCES "introducers"("id"),
  "client_id" uuid NOT NULL REFERENCES "canonical_clients"("id"),
  "provider_id" uuid NOT NULL REFERENCES "providers"("id"),
  "gross_minor" integer NOT NULL,
  "net_minor" integer NOT NULL,
  "share_minor" integer NOT NULL,
  "currency" text NOT NULL,
  "rate_percent" integer NOT NULL,
  "terms_snapshot" jsonb NOT NULL,
  "posted_at" timestamptz DEFAULT now() NOT NULL,
  "reversed_by_id" uuid
);

CREATE TABLE IF NOT EXISTS "agreements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "introducer_id" uuid NOT NULL REFERENCES "introducers"("id"),
  "agreement_type" text NOT NULL,
  "version" text NOT NULL,
  "content" text NOT NULL,
  "content_hash" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "accepted_at" timestamptz,
  "accepted_by_user_id" uuid,
  "has_unresolved_placeholders" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" uuid,
  "action" text NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" uuid,
  "reason" text,
  "metadata" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "unresolved_particulars" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL UNIQUE,
  "category" text NOT NULL,
  "description" text NOT NULL,
  "blocks_actions" jsonb NOT NULL,
  "resolved" boolean DEFAULT false NOT NULL,
  "resolved_at" timestamptz,
  "resolved_by" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL UNIQUE,
  "value" jsonb NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
