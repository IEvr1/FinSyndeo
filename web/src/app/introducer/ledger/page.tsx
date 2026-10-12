export default function LedgerPage() {
  return (
    <>
      <p className="eyebrow">Commission ledger</p>
      <h1>My commissions</h1>
      <p className="lead">Each receipt or adjustment has its own entry and permanently stored rate.</p>
      <div className="flex gap-3 mb-4">
        <button type="button" className="btn">
          Export statement CSV
        </button>
        <a href="/introducer/invoice" className="btn btn-primary">
          Select commissions and upload invoice
        </a>
      </div>
      <section className="panel">
        <p>No posted commission entries.</p>
      </section>
    </>
  );
}
