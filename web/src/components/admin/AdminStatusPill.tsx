type Tone = "default" | "brand" | "muted" | "warn";

const TONE_CLASS: Record<Tone, string> = {
  default: "admin-pill",
  brand: "admin-pill admin-pill-brand",
  muted: "admin-pill admin-pill-muted",
  warn: "admin-pill admin-pill-warn",
};

export function AdminStatusPill({ label, tone = "default" }: { label: string; tone?: Tone }) {
  return <span className={TONE_CLASS[tone]}>{label}</span>;
}
