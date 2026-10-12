import type { DictionaryRoute, QuestionnaireValues } from "./types";

export function resolveDictionaryRoute(values: QuestionnaireValues): DictionaryRoute {
  const applicant = String(values.applicant ?? "company");
  if (applicant === "individual") return "individual";
  if (applicant === "institution") return "institution";
  const accountType = String(values["account-type"] ?? "bank");
  if (accountType === "merchant") return "merchant";
  if (accountType === "both") return "both";
  if (accountType === "financing") return "financing";
  return "bank";
}

export function isPersonalFlow(values: QuestionnaireValues): boolean {
  return String(values.applicant ?? "") === "individual";
}

/** Mirrors prototype activeFlow() + final-summary inserts (39 before 4, 40 at end). */
export function getQuestionnaireFlow(values: QuestionnaireValues): number[] {
  const personal = isPersonalFlow(values);
  if (personal) {
    return [0, 1, 20, 21, 22, 23, 24, 40];
  }

  const applicant = String(values.applicant ?? "company");
  const accountType = String(values["account-type"] ?? "bank");

  if (applicant === "institution") {
    return [0, 1, 30, 31, 32, 33, 39, 4, 5, 40];
  }

  if (accountType === "financing") {
    return [0, 1, 2, 12, 13, 14, 39, 4, 5, 40];
  }

  const flow: number[] = [0, 1, 2];
  if (accountType !== "merchant") flow.push(3);
  if (accountType !== "bank") flow.push(7, 8, 9, 10, 11);
  flow.push(39, 4, 5, 40);
  return flow;
}

export function apiRouteFromValues(values: QuestionnaireValues): string {
  return resolveDictionaryRoute(values);
}
