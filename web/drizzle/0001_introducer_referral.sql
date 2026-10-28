ALTER TABLE "introducers" ADD COLUMN IF NOT EXISTS "link_suspended" boolean DEFAULT false NOT NULL;

ALTER TABLE "canonical_clients" ADD CONSTRAINT "canonical_clients_introducer_id_fkey"
  FOREIGN KEY ("introducer_id") REFERENCES "introducers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "commission_entries" ADD COLUMN IF NOT EXISTS "relationship_id" uuid;
ALTER TABLE "commission_entries" ADD COLUMN IF NOT EXISTS "receipt_allocation_id" uuid;
ALTER TABLE "commission_entries" ADD COLUMN IF NOT EXISTS "statement_line_id" text;
ALTER TABLE "commission_entries" ADD COLUMN IF NOT EXISTS "supplier_invoice_allocation_id" uuid;

CREATE UNIQUE INDEX IF NOT EXISTS "commission_statement_line_idx" ON "commission_entries" ("statement_line_id");
CREATE UNIQUE INDEX IF NOT EXISTS "commission_receipt_allocation_idx" ON "commission_entries" ("receipt_allocation_id");

CREATE TABLE IF NOT EXISTS "provider_relationships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "applications"("id"),
  "client_id" uuid NOT NULL REFERENCES "canonical_clients"("id"),
  "provider_id" uuid NOT NULL REFERENCES "providers"("id"),
  "product" text NOT NULL,
  "status" text DEFAULT 'submitted' NOT NULL,
  "dd_clear" boolean DEFAULT false NOT NULL,
  "evidence" jsonb,
  "activated_at" timestamp with time zone,
  "financing_first_disbursement_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "provider_relationship_app_idx" ON "provider_relationships" ("application_id");
CREATE INDEX IF NOT EXISTS "provider_relationship_client_idx" ON "provider_relationships" ("client_id");

CREATE TABLE IF NOT EXISTS "provider_statements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id"),
  "statement_reference" text NOT NULL,
  "period_label" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "provider_cash_receipts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_id" uuid NOT NULL REFERENCES "providers"("id"),
  "statement_id" uuid REFERENCES "provider_statements"("id"),
  "bank_reference" text NOT NULL,
  "currency" text NOT NULL,
  "value_date" timestamp with time zone NOT NULL,
  "verified_cash_minor" integer NOT NULL,
  "evidence" jsonb,
  "verified_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "provider_cash_receipt_bank_ref_idx" ON "provider_cash_receipts" ("bank_reference");

CREATE TABLE IF NOT EXISTS "receipt_allocations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "receipt_id" uuid NOT NULL REFERENCES "provider_cash_receipts"("id") ON DELETE CASCADE,
  "statement_line_id" text NOT NULL,
  "relationship_id" uuid NOT NULL REFERENCES "provider_relationships"("id"),
  "gross_minor" integer NOT NULL,
  "vat_minor" integer DEFAULT 0 NOT NULL,
  "withholding_minor" integer DEFAULT 0 NOT NULL,
  "charges_minor" integer DEFAULT 0 NOT NULL,
  "tax_mode" text NOT NULL,
  "expected_cash_minor" integer NOT NULL,
  "eligible_net_minor" integer NOT NULL,
  "actual_cash_minor" integer NOT NULL,
  "hold_reason" text,
  "commission_entry_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "receipt_allocation_line_idx" ON "receipt_allocations" ("statement_line_id");

CREATE TABLE IF NOT EXISTS "supplier_invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "introducer_id" uuid NOT NULL REFERENCES "introducers"("id"),
  "invoice_number" text NOT NULL,
  "currency" text NOT NULL,
  "subtotal_minor" integer NOT NULL,
  "tax_minor" integer DEFAULT 0 NOT NULL,
  "total_minor" integer NOT NULL,
  "status" text DEFAULT 'submitted' NOT NULL,
  "document_id" uuid,
  "rejected_reason" text,
  "prior_invoice_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "supplier_invoice_allocations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "invoice_id" uuid NOT NULL REFERENCES "supplier_invoices"("id") ON DELETE CASCADE,
  "commission_entry_id" uuid NOT NULL REFERENCES "commission_entries"("id"),
  "amount_minor" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "supplier_invoice_entry_idx" ON "supplier_invoice_allocations" ("commission_entry_id");

CREATE TABLE IF NOT EXISTS "supplier_payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "invoice_id" uuid NOT NULL REFERENCES "supplier_invoices"("id"),
  "amount_minor" integer NOT NULL,
  "currency" text NOT NULL,
  "value_date" timestamp with time zone NOT NULL,
  "bank_reference" text NOT NULL,
  "status" text DEFAULT 'recorded' NOT NULL,
  "recorded_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "supplier_payment_bank_ref_idx" ON "supplier_payments" ("bank_reference");
