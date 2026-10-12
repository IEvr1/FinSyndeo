"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; group?: string };

type Props = {
  role: string;
  persona: string;
  nav: NavItem[];
  children: React.ReactNode;
};

const WORKSPACE_LABELS: Record<string, string> = {
  applicant: "Applicant workspace",
  provider: "Provider workspace",
  introducer: "Introducer workspace",
  admin: "SOPHIMA Admin",
};

export function PlatformShell({ role, persona, nav, children }: Props) {
  const workspaceLabel = WORKSPACE_LABELS[role] ?? `${role} workspace`;
  const pathname = usePathname();
  const groups = [...new Set(nav.map((n) => n.group).filter(Boolean))];

  return (
    <>
      <header className="flex justify-between items-center px-6 py-5 bg-white border-b border-[var(--line)] gap-6">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image
            src="/assets/FinSyndeo-logo.png"
            alt="FinSyndeo by SOPHIMA"
            width={180}
            height={48}
            priority
          />
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--muted)]">{persona}</span>
          <form action="/api/auth/sign-out" method="post">
            <button type="submit" className="btn text-sm py-2 px-3">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] max-w-[1440px] mx-auto">
        <aside className="p-6 md:sticky md:top-0">
          <div className="mb-5 text-xs text-[var(--muted)]">
            <b className="block text-base text-[var(--ink)] mb-1">{workspaceLabel}</b>
            {persona}
          </div>
          <nav className="flex md:grid flex-wrap md:flex-col gap-2" aria-label="Platform navigation">
            {groups.length > 0
              ? groups.flatMap((group) => [
                  <div
                    key={`g-${group}`}
                    className="hidden md:block text-xs font-bold uppercase tracking-wide text-[#6c5740] mt-4 mb-1 px-2"
                  >
                    {group}
                  </div>,
                  ...nav
                    .filter((n) => n.group === group)
                    .map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={pathname === item.href ? "page" : undefined}
                        className={`text-left text-sm px-3 py-2 rounded no-underline border md:border-0 ${
                          pathname === item.href
                            ? "bg-[var(--soft)] text-[var(--brand)] font-bold"
                            : "text-[var(--ink)] hover:bg-[var(--soft)]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    )),
                ])
              : nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={`text-left text-sm px-3 py-2 rounded no-underline border md:border-0 ${
                      pathname === item.href
                        ? "bg-[var(--soft)] text-[var(--brand)] font-bold"
                        : "text-[var(--ink)] hover:bg-[var(--soft)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
          </nav>
        </aside>
        <main className="p-6 md:p-7 min-w-0">{children}</main>
      </div>
    </>
  );
}
