"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { DailyFlowTable } from "@/components/dashboard/daily-flow-table";
import { ForecastTable } from "@/components/dashboard/forecast-table";
import { calculateDailyFlow, type DailyFlowResult } from "@/lib/daily-flow";
import { calculateForecast, type ForecastResult } from "@/lib/forecast";
import { getCurrentCompetencyMonth } from "@/lib/closing-day";
import { usePreferences } from "@/contexts/preferences-context";

type Tab = "diario" | "previsto";

export default function FluxoPage() {
  const supabase = createClient();
  const { closingDay, loading: prefsLoading } = usePreferences();

  const { year: initYear, month: initMonth } = getCurrentCompetencyMonth(closingDay);
  const [tab, setTab] = useState<Tab>("diario");
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);

  const handlePrevMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 0) { setYear((y) => y - 1); return 11; }
      return prev - 1;
    });
  }, []);
  const handleNextMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 11) { setYear((y) => y + 1); return 0; }
      return prev + 1;
    });
  }, []);
  const [dailyFlow, setDailyFlow] = useState<DailyFlowResult | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync initial year/month when closingDay loads
  useEffect(() => {
    if (!prefsLoading) {
      const { year: y, month: m } = getCurrentCompetencyMonth(closingDay);
      setYear(y);
      setMonth(m);
    }
  }, [closingDay, prefsLoading]);

  const fetchDailyFlow = useCallback(async () => {
    setLoading(true);
    const result = await calculateDailyFlow(supabase, year, month, closingDay);
    setDailyFlow(result);
    setLoading(false);
  }, [year, month, closingDay]);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    const result = await calculateForecast(supabase, 3, true, closingDay);
    setForecast(result);
    setLoading(false);
  }, [closingDay]);

  useEffect(() => {
    if (prefsLoading) return;
    if (tab === "diario") {
      fetchDailyFlow();
    } else {
      fetchForecast();
    }
  }, [tab, fetchDailyFlow, fetchForecast, prefsLoading]);


  const tabs: { key: Tab; label: string; description: string }[] = [
    { key: "diario", label: "Fluxo Diário", description: "Movimentação dia a dia do mês" },
    { key: "previsto", label: "Fluxo Previsto", description: "Projeção do mês atual e próximos meses" },
  ];

  return (
    <div>
      <PageHeader
        title="Fluxo"
        description={tabs.find((t) => t.key === tab)?.description ?? ""}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-tab-bg rounded-lg p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-card text-on-surface shadow-sm"
                : "text-on-surface-muted hover:text-on-surface-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Month picker — only for Fluxo Diário */}
      {tab === "diario" && (
        <div className="mb-6">
          <MonthPicker
            year={year}
            month={month}
            onPrev={handlePrevMonth}
            onNext={handleNextMonth}
            closingDay={closingDay}
          />
        </div>
      )}

      {/* Content */}
      {loading || prefsLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : tab === "diario" ? (
        dailyFlow && (
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <DailyFlowTable data={dailyFlow} />
          </div>
        )
      ) : forecast ? (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <ForecastTable months={forecast.months} />
        </div>
      ) : null}
    </div>
  );
}
