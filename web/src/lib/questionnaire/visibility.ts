import type { ApplicantField, QuestionnaireValues } from "./types";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "on";
}

function labelIsEuAgentFollowUp(label: string | undefined): boolean {
  if (!label) return false;
  return (
    label === "EU subsidiary legal name" ||
    label === "Country of incorporation" ||
    label === "Subsidiary registration number" ||
    label === "Describe its role in receiving or processing payments"
  );
}

export function isFieldVisible(field: ApplicantField, values: QuestionnaireValues): boolean {
  const id = field.id;

  if (id === "registration-exception-reason" || id === "registration-notissued") {
    return bool(values["registration-notissued"]);
  }
  if (id === "registration" && bool(values["registration-notissued"])) {
    return false;
  }
  if (id === "entity-type-other") {
    return str(values["entity-type"]).includes("Other");
  }
  if (id === "plc-exchange" || id === "plc-disclosure") {
    return str(values["plc-listed"]) === "Yes";
  }
  if (id === "agent-subsidiary" || id?.startsWith("agent-")) {
    return str(values.agent) === "Yes";
  }
  if (
    labelIsEuAgentFollowUp(field.label) &&
    str(values.agent) !== "Yes"
  ) {
    return false;
  }
  if (id === "representative-firm") {
    const role = str(values["representative-role"]);
    return role.includes("Adviser") || role.includes("Agent") || role.includes("Other");
  }
  if (id === "purpose-other-check" || field.key === "id:purpose-other-check") {
    return true;
  }
  if (id === "finance-other-text") {
    return str(values["finance-purpose"]).includes("Other");
  }
  if (id === "finance-currency-code") {
    return str(values["finance-currency"]) === "Other";
  }
  if (id === "estimate-other-code") {
    return str(values["estimate-currency"]) === "Other";
  }
  if (id === "bank-other-text") {
    return bool(values["bank-other-currency"]);
  }
  if (id === "pb-currencies-text") {
    return bool(values["pb-currencies-other"]);
  }
  if (id === "fi-other-currency-text") {
    return bool(values["fi-other-currency"]);
  }

  return true;
}

export function isRenderableVisible(
  item: { kind: string; field?: ApplicantField; name?: string },
  values: QuestionnaireValues
): boolean {
  if (item.kind === "field" && item.field) {
    return isFieldVisible(item.field, values);
  }
  if (item.kind === "radio-group" && item.name === "licence") {
    return str(values.industry) !== "" || str(values.activity) !== "";
  }
  return true;
}
