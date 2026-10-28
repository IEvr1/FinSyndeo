import { ReferralsContent } from "@/components/introducer/ReferralsContent";

export default function ReferralsPage() {
  return (
    <>
      <p className="eyebrow">Referrals</p>
      <h1>My referrals</h1>
      <p className="lead">Attributed referral history for your approved referral link.</p>
      <ReferralsContent />
    </>
  );
}
