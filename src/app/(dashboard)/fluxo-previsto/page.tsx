"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ForecastTable } from "@/components/dashboard/forecast-table";
import { calculateForecast, type ForecastResult } from "@/lib/forecast";
import { usePreferences } from "@/contexts/preferences-context";

export default function FluxoPrevistoPage() {
  const supabase = createClient();
  const { closingDay, loading: prefsLoading } = usePreferences();
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await calculateForecast(supabase, 3, true, closingDay);
    setForecast(result);
    setLoading(false);
  }, [supabase, closingDay]);

  useEffect(() => {
    if (!prefsLoading) {
      fetchData();
    }
  }, [fetchData, prefsLoading]);

  return (
    <div>
      <PageHeader
        title="Fluxo Previsto"
        description="Projeção do mês atual e próximos meses"
      />

      {loading || prefsLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : forecast ? (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-blue-100 p-6 shadow-sm">
          <div className="bg-white rounded-lg p-4 border border-slate-100">
            <ForecastTable months={forecast.months} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
