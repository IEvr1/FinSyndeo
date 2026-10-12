export const STEP_LABELS: Record<number, string> = {
  0: "Start",
  1: "Company",
  2: "Business activity",
  3: "Account & flows",
  4: "Ownership",
  5: "Contact",
  7: "Payment channels",
  8: "Countries & volumes",
  9: "Processing history",
  10: "Preferences",
  11: "Settlement",
  12: "Financing need",
  13: "Project details",
  14: "Security & timeline",
  20: "Personal details",
  21: "Wealth profile",
  22: "Sources of funds",
  23: "Expected activity",
  24: "Contact",
  30: "Institution profile",
  31: "Underlying clients",
  32: "Services & flows",
  33: "Compliance",
  39: "Existing banking",
  40: "Your Assessment Summary",
};

export const STEP_EYEBROWS: Record<number, string> = {
  0: "START",
  1: "STEP 1 · COMPANY PROFILE",
  20: "PRIVATE BANKING",
  24: "PRIVATE BANKING",
  30: "FINANCIAL INSTITUTION",
  40: "REVIEW",
};

export function stepTitle(step: number): string {
  return STEP_LABELS[step] ?? `Step ${step}`;
}

export function stepEyebrow(step: number, personal: boolean): string {
  if (step === 1 && personal) return "PRIVATE BANKING";
  return STEP_EYEBROWS[step] ?? `STEP · ${STEP_LABELS[step] ?? step}`;
}
