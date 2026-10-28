import { AdminStatusPill } from "@/components/admin/AdminStatusPill";
import { UNRESOLVED_PARTICULARS } from "@/lib/unresolved";

export function UnresolvedList({ filter }: { filter?: "open" | "all" }) {
  const items =
    filter === "all"
      ? UNRESOLVED_PARTICULARS
      : UNRESOLVED_PARTICULARS.filter((p) => !p.resolved);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Category</th>
            <th>Description</th>
            <th>Blocks</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.key}>
              <td>{p.key}</td>
              <td>{p.category}</td>
              <td>
                {p.description}
                {p.note ? <div className="text-xs text-[var(--muted)] mt-1">{p.note}</div> : null}
              </td>
              <td>{p.blocksActions.join(", ") || "—"}</td>
              <td>
                <AdminStatusPill label={p.resolved ? "Resolved" : "Open"} tone={p.resolved ? "muted" : "warn"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
