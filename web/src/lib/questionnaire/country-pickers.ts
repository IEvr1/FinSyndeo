/** Hidden dictionary fields that use multi-country pickers in the prototype. */
export const COUNTRY_PICKER_IDS = new Set([
  "pb-nationality",
  "pb-tax",
  "pb-origin-country",
  "pb-incoming",
  "pb-outgoing",
  "fi-client-countries",
  "fi-underlying-countries",
  "fi-incoming",
  "fi-outgoing",
  "fi-client-in",
  "fi-client-out",
]);

export const SUPPLEMENTAL_COUNTRY_PICKERS: Array<{ id: string; label: string; steps: number[] }> = [
  { id: "bank-incoming-countries", label: "Incoming transfer countries", steps: [3] },
  { id: "bank-outgoing-countries", label: "Outgoing transfer countries", steps: [3] },
];

export function isCountryPickerField(id: string | null, type: string): boolean {
  if (!id) return false;
  if (type === "hidden" && COUNTRY_PICKER_IDS.has(id)) return true;
  return false;
}

export function countryPickerLabel(id: string): string {
  const labels: Record<string, string> = {
    "pb-nationality": "Nationality / citizenship",
    "pb-tax": "Country(ies) of tax residence",
    "pb-origin-country": "Country(ies) where funds originate",
    "pb-incoming": "Countries you expect to receive funds from",
    "pb-outgoing": "Countries you expect to send funds to",
    "fi-client-countries": "Underlying client countries",
    "fi-underlying-countries": "Underlying client countries (specific list)",
    "fi-incoming": "Operational incoming countries",
    "fi-outgoing": "Operational outgoing countries",
    "fi-client-in": "Client-funds incoming countries",
    "fi-client-out": "Client-funds outgoing countries",
    "bank-incoming-countries": "Incoming transfer countries",
    "bank-outgoing-countries": "Outgoing transfer countries",
  };
  return labels[id] ?? id;
}
