export type DictionaryRoute =
  | "bank"
  | "merchant"
  | "both"
  | "financing"
  | "individual"
  | "institution";

export type ApplicantField = {
  key: string;
  id: string | null;
  step: string;
  label: string;
  type: string;
  required: boolean;
  choices?: Array<{ value: string; label: string }>;
};

export type FieldValue = string | boolean | string[];

export type QuestionnaireValues = Record<string, FieldValue>;

export type CountryPickers = Record<string, string[]>;

export type RenderableField =
  | { kind: "field"; field: ApplicantField }
  | { kind: "radio-group"; name: string; legend: string; options: ApplicantField[]; required: boolean }
  | { kind: "country-picker"; id: string; label: string; required: boolean };
