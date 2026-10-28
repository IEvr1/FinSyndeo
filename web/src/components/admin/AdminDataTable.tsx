import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

export type AdminColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: AdminColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = "No records yet",
  emptyDescription = "Operational data will appear here when applicants, providers or introducers use the platform.",
}: Props<T>) {
  if (rows.length === 0) {
    return <AdminEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.key}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
