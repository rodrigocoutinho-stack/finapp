"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "./skeleton";

function SortIcon({ direction }: { direction: SortDirection | null }) {
  return (
    <svg
      className="w-3 h-3 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 15l5 5 5-5" opacity={direction === "desc" ? 1 : direction === "asc" ? 0.25 : 0.4} />
      <path d="M7 9l5-5 5 5" opacity={direction === "asc" ? 1 : direction === "desc" ? 0.25 : 0.4} />
    </svg>
  );
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  pageSize: number;
}

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortKey?: string;
}

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  pagination?: PaginationProps;
  sortState?: SortState | null;
  onSortChange?: (key: string) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  actions,
  emptyMessage = "Nenhum registro encontrado.",
  loading = false,
  pagination,
  sortState,
  onSortChange,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Header skeleton */}
          <div className="flex gap-4 pb-2">
            {columns.map((col) => (
              <Skeleton key={col.key} className="h-4 flex-1" />
            ))}
            {actions && <Skeleton className="h-4 w-20" />}
          </div>
          {/* Row skeletons */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {columns.map((col) => (
                <Skeleton key={col.key} className="h-4 flex-1" />
              ))}
              {actions && <Skeleton className="h-4 w-20" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <p className="text-on-surface-muted text-center py-8">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-light bg-surface-alt">
              {columns.map((col) => {
                const sortKey = col.sortKey ?? col.key;
                const isSortable = !!col.sortable && !!onSortChange;
                const isActive = isSortable && sortState?.key === sortKey;
                const direction = isActive ? sortState!.direction : null;
                const isRightAligned = (col.headerClassName ?? "").includes("text-right");

                return (
                  <th
                    key={col.key}
                    aria-sort={
                      isActive
                        ? direction === "asc"
                          ? "ascending"
                          : "descending"
                        : isSortable
                          ? "none"
                          : undefined
                    }
                    className={`text-left px-4 py-3 font-medium text-on-surface-secondary ${col.headerClassName ?? ""}`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => onSortChange!(sortKey)}
                        className={`inline-flex items-center gap-1 select-none hover:text-on-surface transition-colors ${
                          isRightAligned ? "flex-row-reverse" : ""
                        } ${isActive ? "text-on-surface" : ""}`}
                      >
                        <span>{col.header}</span>
                        <SortIcon direction={direction} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {actions && (
                <th className="text-right px-4 py-3 font-medium text-on-surface-secondary">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="border-b border-border-light hover:bg-hover"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                    {col.render(item)}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right">
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-sm text-on-surface-muted">
            {pagination.totalCount} registros
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="text-xs px-3 py-1"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-on-surface-secondary">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            <Button
              variant="secondary"
              className="text-xs px-3 py-1"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
