export const instant = false;

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PENDING_REFERRAL_COOKIE, PENDING_REFERRAL_MAX_AGE } from "@/lib/referrals/constants";
import { isLinkActiveForToken } from "@/lib/services/referrals";

export default async function ReferralLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { active, introducer } = await isLinkActiveForToken(token);

  if (!active || !introducer) {
    return (
      <>
        <p className="eyebrow">Referral</p>
        <h1>Referral link unavailable</h1>
        <p className="lead">Please contact SOPHIMA for assistance.</p>
        <Link href="/" className="btn btn-primary">
          Go to home
        </Link>
      </>
    );
  }

  const jar = await cookies();
  jar.set(PENDING_REFERRAL_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: PENDING_REFERRAL_MAX_AGE,
    path: "/",
  });

  redirect("/auth/sign-up?role=applicant&ref=captured");
}
