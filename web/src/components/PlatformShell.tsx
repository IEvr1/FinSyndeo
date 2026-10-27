"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";

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
  admin: "Restricted administration",
};

export function PlatformShell({ role, persona, nav, children }: Props) {
  const workspaceLabel = WORKSPACE_LABELS[role] ?? `${role} workspace`;
  const pathname = usePathname();
  const groups = [...new Set(nav.map((n) => n.group).filter(Boolean))];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper)]">
      <header className="flex justify-between items-center px-6 py-5 bg-white border-b border-[var(--line)] gap-6">
        <BrandLogo priority />
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--muted)] hidden sm:inline">{workspaceLabel}</span>
          <form action="/api/auth/sign-out" method="post">
            <button type="submit" className="btn text-sm py-2 px-3">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] max-w-[1440px] mx-auto w-full flex-1">
        <aside className="p-6 md:sticky md:top-0">
          <div className="mb-5 text-xs text-[var(--muted)]">
            <b className="block text-base text-[var(--ink)] mb-1">
              {role === "admin" ? "SOPHIMA Administration" : workspaceLabel}
            </b>
            {role === "admin" ? "Authorised staff only" : persona}
            {role === "admin" && persona ? (
              <span className="block mt-1 truncate" title={persona}>
                {persona}
              </span>
            ) : null}
          </div>
          <nav className="flex md:grid flex-wrap md:flex-col gap-2" aria-label="Platform navigation">
            {groups.length > 0
              ? groups.flatMap((group) => [
                  <div
                    key={`g-${group}`}
                    className="hidden md:block text-xs font-bold uppercase tracking-wide text-[var(--brand)] mt-4 mb-1 px-2"
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
      <SiteFooter />
    </div>
  );
}
