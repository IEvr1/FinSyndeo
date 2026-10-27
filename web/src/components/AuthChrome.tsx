import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";

type Props = {
  children: React.ReactNode;
  nav?: React.ReactNode;
};

export function AuthChrome({ children, nav }: Props) {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="flex justify-between items-center px-6 py-5 bg-white border-b border-[var(--line)] gap-4">
        <BrandLogo priority />
        {nav}
      </header>
      <main className="max-w-xl mx-auto px-6 py-12 w-full flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
