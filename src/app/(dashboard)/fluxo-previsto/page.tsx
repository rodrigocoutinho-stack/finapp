"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ForecastTable } from "@/components/dashboard/forecast-table";
import { calculateForecast, type ForecastResult } from "@/lib/forecast";

export default function FluxoPrevistoPage() {
  const supabase = createClient();
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await calculateForecast(supabase, 3, true);
    setForecast(result);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fluxo Previsto</h1>
          <p className="text-gray-600 text-sm mt-1">
            Projeção do mês atual e próximos meses
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : forecast ? (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-blue-100 p-5 shadow-sm">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <ForecastTable months={forecast.months} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
