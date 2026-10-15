import { redirect } from "next/navigation";

/** Standalone sharing page removed — controls live under My introductions. */
export default async function ApplicantSharingRedirect({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; intro?: string }>;
}) {
  const q = await searchParams;
  const parts = new URLSearchParams();
  parts.set("view", "introductions");
  if (q.id) parts.set("id", q.id);
  if (q.intro) parts.set("intro", q.intro);
  redirect(`/applicant/results?${parts.toString()}`);
}
