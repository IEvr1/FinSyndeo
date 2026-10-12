import rawDictionary from "@/data/APPLICANT-FIELD-DICTIONARY.json";
import {
  SUPPLEMENTAL_COUNTRY_PICKERS,
  countryPickerLabel,
  isCountryPickerField,
} from "./country-pickers";
import type { ApplicantField, DictionaryRoute, RenderableField } from "./types";

type RouteEntry = { route: string; fields: ApplicantField[] };

const dictionary = rawDictionary as RouteEntry[];

export function getRouteFields(route: DictionaryRoute): ApplicantField[] {
  return dictionary.find((r) => r.route === route)?.fields ?? [];
}

export function fieldStorageKey(field: ApplicantField): string {
  return field.id ?? field.key;
}

function dedupeFields(fields: ApplicantField[]): ApplicantField[] {
  const seen = new Set<string>();
  const out: ApplicantField[] = [];
  for (const f of fields) {
    const key = fieldStorageKey(f);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

export function getFieldsForStep(route: DictionaryRoute, step: number): ApplicantField[] {
  const stepStr = String(step);
  return dedupeFields(getRouteFields(route).filter((f) => f.step === stepStr));
}

function inferRadioGroupName(options: ApplicantField[]): string {
  const keys = options.map((o) => o.key);
  if (options.every((o) => ["Yes", "No"].includes(o.label))) {
    const step = options[0]?.step;
    if (step === "2" && keys.some((k) => k.includes("uvfx4e") || k.includes("antex0"))) {
      return "licence";
    }
  }
  if (options.some((o) => ["0", "1–5", "6–25", "More than 25"].includes(o.label))) {
    return "employees";
  }
  if (options.some((o) => o.label === "Yes" || o.label === "No") && options.length === 2) {
    return `radio-${options[0].step}-${options[0].key}`;
  }
  return `radio-${options[0].key}`;
}

export function buildRenderableStep(
  route: DictionaryRoute,
  step: number
): RenderableField[] {
  const fields = getFieldsForStep(route, step);
  const items: RenderableField[] = [];
  let i = 0;

  while (i < fields.length) {
    const field = fields[i];
    if (isCountryPickerField(field.id, field.type) && field.id) {
      items.push({
        kind: "country-picker",
        id: field.id,
        label: countryPickerLabel(field.id),
        required: field.required,
      });
      i += 1;
      continue;
    }
    if (field.type === "hidden") {
      i += 1;
      continue;
    }
    if (field.type === "radio" && !field.id) {
      const options: ApplicantField[] = [];
      while (i < fields.length && fields[i].type === "radio" && !fields[i].id) {
        options.push(fields[i]);
        i += 1;
      }
      const legend =
        options.some((o) => o.label === "0" || o.label === "1–5")
          ? "How many people does the company employ?"
          : options.every((o) => ["Yes", "No"].includes(o.label))
            ? "Does your activity require a licence or authorisation?"
            : "Select one";
      items.push({
        kind: "radio-group",
        name: inferRadioGroupName(options),
        legend,
        options,
        required: options.some((o) => o.required),
      });
      continue;
    }
    items.push({ kind: "field", field });
    i += 1;
  }

  for (const sup of SUPPLEMENTAL_COUNTRY_PICKERS) {
    if (sup.steps.includes(step)) {
      items.push({
        kind: "country-picker",
        id: sup.id,
        label: sup.label,
        required: false,
      });
    }
  }

  return items;
}
