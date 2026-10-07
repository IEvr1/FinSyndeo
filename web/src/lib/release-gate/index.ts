import { isCountryPolicyPublished } from "@/lib/country-policy";
import { screeningBlocksRelease, type ScreeningRunResult } from "@/lib/screening";
import { isActionBlocked } from "@/lib/unresolved";
import { gateEmail, gatePayment } from "@/lib/integrations";

export type ReleaseGateInput = {
  hasCurrentRevision: boolean;
  sharingApprovalValid: boolean;
  sharingRevisionMatches: boolean;
  screeningRuns: ScreeningRunResult[];
  requiresPayment: boolean;
  paymentVerified: boolean;
  ddReportSeparate: boolean;
  profileAttachedNotDd: boolean;
};

export type ReleaseGateResult = {
  allowed: boolean;
  holds: string[];
};

export function evaluateReleaseGate(input: ReleaseGateInput): ReleaseGateResult {
  const holds: string[] = [];

  if (!input.hasCurrentRevision) {
    holds.push("No current confirmed assessment revision.");
  }
  if (!input.sharingApprovalValid) {
    holds.push("Applicant sharing approval missing or withdrawn.");
  }
  if (!input.sharingRevisionMatches) {
    holds.push("Sharing approval does not match current revision.");
  }

  const screening = screeningBlocksRelease(input.screeningRuns);
  if (screening.blocked) {
    holds.push(...screening.reasons);
  }

  if (!isCountryPolicyPublished()) {
    holds.push("Published SOPHIMA country exclusion policy required before release.");
  }

  const countryBlock = isActionBlocked("introduction_release");
  if (countryBlock.blocked) {
    holds.push(...countryBlock.particulars.map((p) => p.description));
  }

  if (input.requiresPayment && !input.paymentVerified) {
    holds.push("Verified payment event required for paid introduction.");
    const payBlock = isActionBlocked("paid_introduction_checkout");
    if (payBlock.blocked) {
      holds.push(...payBlock.particulars.map((p) => p.description));
    }
  }

  if (!input.ddReportSeparate || !input.profileAttachedNotDd) {
    holds.push("Confidential DD report must remain separate from institution profile.");
  }

  const emailGate = gateEmail();
  if (!emailGate.ready) {
    holds.push(emailGate.reason ?? "Email not configured.");
  }

  return { allowed: holds.length === 0, holds };
}

export function evaluateCheckoutGate(): ReleaseGateResult {
  const holds: string[] = [];
  const block = isActionBlocked("paid_introduction_checkout");
  if (block.blocked) {
    holds.push(...block.particulars.map((p) => p.description));
  }
  const payGate = gatePayment();
  if (!payGate.ready) {
    holds.push(payGate.reason ?? "Payment gateway not configured.");
  }
  return { allowed: holds.length === 0, holds };
}
