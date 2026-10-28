export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-narrow" style={{ padding: "2rem 1rem" }}>
      {children}
    </main>
  );
}
