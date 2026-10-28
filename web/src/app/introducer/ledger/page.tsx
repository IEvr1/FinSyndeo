import { LedgerContent } from "@/components/introducer/LedgerContent";

export default function LedgerPage() {
  return (
    <>
      <p className="eyebrow">Commissions</p>
      <h1>My commissions</h1>
      <p className="lead">Posted commission entries under your agreement.</p>
      <LedgerContent />
    </>
  );
}
