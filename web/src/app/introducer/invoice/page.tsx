import { InvoiceUploadContent } from "@/components/introducer/InvoiceUploadContent";

export default function InvoiceUploadPage() {
  return (
    <>
      <p className="eyebrow">Upload invoice</p>
      <h1>Upload a commission invoice</h1>
      <p className="lead">Combine available entries into one invoice, or invoice part of an entry.</p>
      <InvoiceUploadContent />
    </>
  );
}
