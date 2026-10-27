import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer-legal">SOPHIMA AI is operated by SOPHIMA LTD.</p>
      <nav className="site-footer-nav" aria-label="Legal">
        <Link href="/legal/privacy">Privacy notice</Link>
        <span aria-hidden="true">{" | "}</span>
        <Link href="/legal/terms">Terms of use</Link>
      </nav>
    </footer>
  );
}
