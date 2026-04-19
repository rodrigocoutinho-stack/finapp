"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { TransactionForm } from "@/components/transacoes/transaction-form";
import { TransactionList } from "@/components/transacoes/transaction-list";
import {
  TransactionFilters,
  EMPTY_FILTERS,
  type TransactionFiltersState,
} from "@/components/transacoes/transaction-filters";
import { getMonthRange, getMonthName, formatDate } from "@/lib/utils";
import { exportToCsv, type CsvColumn } from "@/lib/csv-export";
import { getCurrentCompetencyMonth } from "@/lib/closing-day";
import { buildCompetencyOrFilter, toCompetencyLabel } from "@/lib/competency";
import { usePreferences } from "@/contexts/preferences-context";
import { useToast } from "@/contexts/toast-context";
import type { Account, Category } from "@/types/database";

const PAGE_SIZE = 50;

interface TransactionWithRelations {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  destination_account_id: string | null;
  type: "receita" | "despesa" | "transferencia";
  amount_cents: number;
  description: string;
  date: string;
  competency_month: string | null;
  created_at: string;
  accounts: { name: string } | null;
  categories: { name: string } | null;
  destination_accounts: { name: string } | null;
}

export default function TransacoesPage() {
  return (
    <Suspense>
      <TransacoesContent />
    </Suspense>
  );
}

function TransacoesContent() {
  const supabase = createClient();
  const { addToast } = useToast();
  const { closingDay, loading: prefsLoading } = usePreferences();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { year: initYear, month: initMonth } = getCurrentCompetencyMonth(closingDay);
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState<"receita" | "despesa" | "transferencia" | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState<TransactionFiltersState>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [exporting, setExporting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevMonth = useCallback(() => {
    setCurrentPage(1);
    setMonth((prev) => {
      if (prev === 0) { setYear((y) => y - 1); return 11; }
      return prev - 1;
    });
  }, []);
  const nextMonth = useCallback(() => {
    setCurrentPage(1);
    setMonth((prev) => {
      if (prev === 11) { setYear((y) => y + 1); return 0; }
      return prev + 1;
    });
  }, []);

  // Auto-open form from query param (?novo=receita|despesa|transferencia)
  const novoParam = searchParams.get("novo");

  useEffect(() => {
    if ((novoParam === "receita" || novoParam === "despesa" || novoParam === "transferencia") && !loading) {
      setFormDefaultType(novoParam);
      setShowForm(true);
      router.replace("/transacoes", { scroll: false });
    }
  }, [novoParam, loading, router]);

  // Sync initial year/month when closingDay loads
  useEffect(() => {
    if (!prefsLoading) {
      const { year: y, month: m } = getCurrentCompetencyMonth(closingDay);
      setYear(y);
      setMonth(m);
    }
  }, [closingDay, prefsLoading]);

  // Debounce search input → filters.search
  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value.trim() }));
      setCurrentPage(1);
    }, 400);
  }, []);

  // Reset page when filters change (except search, handled by debounce)
  const handleFiltersChange = useCallback((newFilters: TransactionFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1);
    // Sync searchInput if filters were cleared
    if (!newFilters.search && searchInput) {
      setSearchInput("");
    }
  }, [searchInput]);

  // Build filtered Supabase query (shared between fetch and export)
  const buildFilteredQuery = useCallback(
    (start: string, end: string) => {
      let query = supabase
        .from("transactions")
        .select("*, accounts:accounts!account_id(name), categories(name), destination_accounts:accounts!destination_account_id(name)", { count: "exact" })
        .or(buildCompetencyOrFilter(toCompetencyLabel(year, month), start, end))
        .order("date", { ascending: false });

      if (filters.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters.accountId) {
        query = query.eq("account_id", filters.accountId);
      }
      if (filters.type === "receita" || filters.type === "despesa" || filters.type === "transferencia") {
        query = query.eq("type", filters.type);
      }
      if (filters.search) {
        query = query.ilike("description", `%${filters.search}%`);
      }

      return query;
    },
    [filters, year, month]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getMonthRange(year, month, closingDay);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const [txRes, accRes, catRes] = await Promise.all([
      buildFilteredQuery(start, end).range(from, to),
      supabase.from("accounts").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);

    setTransactions((txRes.data as TransactionWithRelations[]) ?? []);
    setTotalCount(txRes.count ?? 0);
    setAccounts((accRes.data as Account[]) ?? []);
    setCategories((catRes.data as Category[]) ?? []);
    setLoading(false);
  }, [year, month, closingDay, currentPage, buildFilteredQuery]);

  useEffect(() => {
    if (!prefsLoading) {
      fetchData();
    }
  }, [fetchData, prefsLoading]);

  // Export CSV
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const { start, end } = getMonthRange(year, month, closingDay);
      const { data, error } = await buildFilteredQuery(start, end).limit(1000);

      if (error) {
        addToast("Erro ao exportar transações.", "error");
        return;
      }

      const rows = (data as TransactionWithRelations[]) ?? [];

      if (rows.length === 0) {
        addToast("Nenhuma transação para exportar.", "info");
        return;
      }

      const columns: CsvColumn<TransactionWithRelations>[] = [
        { header: "Data", accessor: (r) => formatDate(r.date) },
        { header: "Descrição", accessor: (r) => r.description },
        {
          header: "Tipo",
          accessor: (r) =>
            r.type === "receita" ? "Receita" : r.type === "transferencia" ? "Transferência" : "Despesa",
        },
        { header: "Valor", accessor: (r) => (r.amount_cents / 100).toFixed(2).replace(".", ",") },
        { header: "Conta", accessor: (r) => r.accounts?.name ?? "" },
        { header: "Conta Destino", accessor: (r) => r.destination_accounts?.name ?? "" },
        { header: "Categoria", accessor: (r) => r.categories?.name ?? "" },
      ];

      const monthStr = String(month + 1).padStart(2, "0");
      exportToCsv(`transacoes-${year}-${monthStr}.csv`, columns, rows);
      addToast(`${rows.length} transações exportadas.`);
    } finally {
      setExporting(false);
    }
  }, [year, month, closingDay, buildFilteredQuery, addToast]);


  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleRefresh = useCallback(() => {
    // If deleting the last item on the current page, go back one page
    if (transactions.length <= 1 && currentPage > 1) {
      setCurrentPage((p) => p - 1);
    } else {
      fetchData();
    }
  }, [transactions.length, currentPage, fetchData]);

  function handleCloseForm() {
    setShowForm(false);
    setFormDefaultType(undefined);
  }

  return (
    <div>
      <PageHeader
        title="Transações"
        description="Registre e acompanhe suas movimentações financeiras. Importe extratos e faturas em OFX, CSV ou PDF."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/transacoes/importar")}>
              Importar
            </Button>
            <Button onClick={() => setShowForm(true)}>Nova transação</Button>
          </div>
        }
      />

      {/* Month navigator */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={prevMonth}
          aria-label="Mês anterior"
          className="p-2 rounded-lg hover:bg-skeleton text-on-surface-secondary"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-lg font-semibold text-on-surface min-w-[180px] text-center">
          {getMonthName(month)} {year}
        </span>
        <button
          onClick={nextMonth}
          aria-label="Próximo mês"
          className="p-2 rounded-lg hover:bg-skeleton text-on-surface-secondary"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <TransactionFilters
        accounts={accounts}
        categories={categories}
        filters={filters}
        searchInput={searchInput}
        onSearchInputChange={handleSearchInputChange}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        exporting={exporting}
      />

      {loading || prefsLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <TransactionList
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          onRefresh={handleRefresh}
          pagination={totalPages > 1 ? {
            currentPage,
            totalPages,
            totalCount,
            onPageChange: setCurrentPage,
            pageSize: PAGE_SIZE,
          } : undefined}
        />
      )}

      <Modal
        open={showForm}
        onClose={handleCloseForm}
        title="Nova transação"
      >
        <TransactionForm
          accounts={accounts}
          categories={categories}
          defaultType={formDefaultType}
          onSuccess={() => {
            handleCloseForm();
            fetchData();
            addToast("Transação criada com sucesso.");
          }}
          onCancel={handleCloseForm}
        />
      </Modal>
    </div>
  );
}
