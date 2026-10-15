const baseUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://finsyndeo.vercel.app";

export function applicantEmailVars(params: {
  firstName?: string;
  caseReference: string;
  service: string;
  email?: string;
}): Record<string, string> {
  const caseRef = params.caseReference;
  const link = `${baseUrl()}/applicant/results?id=${encodeURIComponent(caseRef)}`;
  return {
    "first name": params.firstName ?? "there",
    "case reference": caseRef,
    service: params.service,
    "secure case link": link,
    "results link": link,
    "case link": link,
    "secure confirmation link": `${baseUrl()}/applicant/results?view=introductions&id=${encodeURIComponent(caseRef)}`,
    "case task link": `${baseUrl()}/applicant/questionnaire`,
  };
}
