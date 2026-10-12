export function axesForFamily(family: string): Array<[string, string]> {
  let axes: Array<[string, string]> =
    family === "private"
      ? [
          ["residence", "Applicant residence"],
          ["tax", "Applicant tax residence"],
          ["nationality", "Applicant nationality"],
        ]
      : [
          ["incorporation", "Applicant incorporation / registration"],
          ["uboNationality", "UBO / controlling-person nationality"],
          ["uboResidence", "UBO / controlling-person residence"],
        ];

  if (family !== "finance") {
    axes.push([
      "incoming",
      family === "merchant" ? "Cardholder / card-issuing countries" : "Incoming transfer countries",
    ]);
    axes.push([
      "outgoing",
      family === "merchant" ? "Merchant settlement-bank countries" : "Outgoing transfer countries",
    ]);
  }
  if (family !== "private") {
    axes.push(["shareholder", "Corporate shareholder incorporation"]);
  }
  if (family === "finance") {
    axes.push(["project", "Project / financed-asset location"]);
  }
  if (family === "correspondent") {
    axes.push(["underlying", "Underlying-client countries"]);
  }
  return axes;
}
