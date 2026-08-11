import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index?: number) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  maxHeight?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  className,
  maxHeight = '400px',
}: DataTableProps<T>) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-border bg-card shadow-sm', className)}>
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-primary z-20"></div>
      <div className="overflow-auto scrollbar-thin" style={{ maxHeight }}>
        <table className="data-table">
          <thead className="sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={col.className}>
                    {col.render ? col.render(item, idx) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
