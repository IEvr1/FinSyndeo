type Props = {
  children?: React.ReactNode;
  hint?: string;
};

export function AdminToolbar({ children, hint }: Props) {
  return (
    <div className="toolbar mb-4">
      {hint ? <span className="text-sm text-[var(--muted)]">{hint}</span> : null}
      <div className="ml-auto flex flex-wrap gap-2 items-center">{children}</div>
    </div>
  );
}
