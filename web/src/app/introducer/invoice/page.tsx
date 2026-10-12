export default function InvoiceUploadPage() {
  return (
    <>
      <p className="eyebrow">Upload invoice</p>
      <h1>Upload a commission invoice</h1>
      <p className="lead">Combine available entries into one invoice, or invoice part of an entry.</p>
      <section className="panel">
        <p>Link invoice to eligible commission allocations. Upload through the portal; emailed invoices do not enter this workflow.</p>
        <button type="button" className="btn btn-primary mt-4">
          Upload for SOPHIMA review
        </button>
      </section>
    </>
  );
}
