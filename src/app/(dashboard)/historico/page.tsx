"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { KpiHistory } from "@/components/historico/kpi-history";
import type { MonthlyClosingRow } from "@/types/database";

export default function HistoricoPage() {
  const supabase = createClient();
  const [closings, setClosings] = useState<MonthlyClosingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClosings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("monthly_closings")
      .select("*")
      .order("month", { ascending: true });
    setClosings((data as MonthlyClosingRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClosings();
  }, [fetchClosings]);

  return (
    <div>
      <PageHeader
        title="Historico de KPIs"
        description="Evolucao dos seus indicadores financeiros mes a mes"
      />

      {loading ? (
        <TableSkeleton />
      ) : closings.length === 0 ? (
        <EmptyState message="Nenhum fechamento mensal encontrado. Feche meses pelo Dashboard para acompanhar a evolucao dos seus KPIs." />
      ) : (
        <KpiHistory closings={closings} />
      )}
    </div>
  );
}
