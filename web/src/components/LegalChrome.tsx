import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";

export function LegalChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="px-6 py-5 bg-white border-b border-[var(--line)]">
        <BrandLogo />
      </header>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
