/** Shared onboarding method labels — provider profile and applicant questionnaire. */

export const APPLICANT_ONBOARDING_METHODS = [
  "Remote — online identity verification",
  "Remote — recorded video identification",
  "Remote — live video interview",
  "In-person onboarding",
  "Other — please specify",
  "No preference",
] as const;

export const PROVIDER_ONBOARDING_METHODS = APPLICANT_ONBOARDING_METHODS.filter((m) => m !== "No preference");

export function onboardingStorageKey(method: string): string {
  return `onboarding:${method}`;
}
