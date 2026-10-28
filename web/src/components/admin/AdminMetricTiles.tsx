import Link from "next/link";

type Metric = { label: string; value: number | string; href?: string };

export function AdminMetricTiles({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="tiles mb-6">
      {metrics.map((m) => (
        <section key={m.label} className="tile">
          <p className="eyebrow mb-1">{m.label}</p>
          <p className="text-3xl font-bold m-0 mb-2">{m.value}</p>
          {m.href ? (
            <Link href={m.href} className="btn text-sm">
              View
            </Link>
          ) : null}
        </section>
      ))}
    </div>
  );
}
