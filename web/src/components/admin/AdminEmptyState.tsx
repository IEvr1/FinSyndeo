import Link from "next/link";

type Props = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function AdminEmptyState({ title, description, actionHref, actionLabel }: Props) {
  return (
    <section className="panel">
      <h2 className="text-lg mt-0 mb-2">{title}</h2>
      <p className="text-[var(--muted)] m-0 mb-4">{description}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn btn-primary">
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
