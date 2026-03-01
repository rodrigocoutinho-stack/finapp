"use client";

import { Button } from "@/components/ui/button";
import type { Account, Category } from "@/types/database";

export interface TransactionFiltersState {
  categoryId: string;
  accountId: string;
  type: string;
  search: string;
}

export const EMPTY_FILTERS: TransactionFiltersState = {
  categoryId: "",
  accountId: "",
  type: "",
  search: "",
};

interface TransactionFiltersProps {
  accounts: Account[];
  categories: Category[];
  filters: TransactionFiltersState;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onFiltersChange: (filters: TransactionFiltersState) => void;
  onExport: () => void;
  exporting: boolean;
}

export function TransactionFilters({
  accounts,
  categories,
  filters,
  searchInput,
  onSearchInputChange,
  onFiltersChange,
  onExport,
  exporting,
}: TransactionFiltersProps) {
  const hasActiveFilter =
    filters.categoryId || filters.accountId || filters.type || filters.search;

  const update = (partial: Partial<TransactionFiltersState>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <input
        type="text"
        placeholder="Buscar descrição..."
        value={searchInput}
        onChange={(e) => onSearchInputChange(e.target.value)}
        className="rounded-lg border border-input-border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 w-48"
      />

      <select
        value={filters.categoryId}
        onChange={(e) => update({ categoryId: e.target.value })}
        className="rounded-lg border border-input-border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-on-surface"
      >
        <option value="">Todas categorias</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={filters.accountId}
        onChange={(e) => update({ accountId: e.target.value })}
        className="rounded-lg border border-input-border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-on-surface"
      >
        <option value="">Todas contas</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <select
        value={filters.type}
        onChange={(e) => update({ type: e.target.value })}
        className="rounded-lg border border-input-border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-on-surface"
      >
        <option value="">Todos tipos</option>
        <option value="receita">Receita</option>
        <option value="despesa">Despesa</option>
      </select>

      {hasActiveFilter && (
        <Button
          variant="ghost"
          onClick={() => {
            onFiltersChange(EMPTY_FILTERS);
            onSearchInputChange("");
          }}
          className="text-xs"
        >
          Limpar filtros
        </Button>
      )}

      <div className="ml-auto">
        <Button variant="secondary" onClick={onExport} loading={exporting}>
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}
