export const PENDING_REFERRAL_COOKIE = "pending_referral_token";
export const PENDING_REFERRAL_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const AGREEMENT_TYPE_MASTER = "Master";
export const AGREEMENT_TYPE_SCHEDULE = "Schedule";

export type ReferralContext = {
  introducerId: string;
  tokenUsed: string;
  onBehalf: boolean;
  authorityConfirmed?: boolean;
  submittedByUserId: string;
  applicantConfirmedAt?: string | null;
  capturedAt: string;
};
