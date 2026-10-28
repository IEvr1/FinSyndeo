import { PaymentsContent } from "@/components/introducer/PaymentsContent";

export default function IntroducerPaymentsPage() {
  return (
    <>
      <p className="eyebrow">Settlement</p>
      <h1>Payments & reconciliation</h1>
      <p className="lead">Invoice status and recorded payments (no internal bank proof shown).</p>
      <PaymentsContent />
    </>
  );
}
