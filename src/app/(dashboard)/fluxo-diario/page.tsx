"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { DailyFlowTable } from "@/components/dashboard/daily-flow-table";
import { calculateDailyFlow, type DailyFlowResult } from "@/lib/daily-flow";

export default function FluxoDiarioPage() {
  const supabase = createClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<DailyFlowResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await calculateDailyFlow(supabase, year, month);
    setData(result);
    setLoading(false);
  }, [supabase, year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fluxo Diário</h1>
          <p className="text-gray-600 text-sm mt-1">
            Visão diária de entradas, saídas e saldo
          </p>
        </div>
      </div>

      <div className="mb-6">
        <MonthPicker year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : data ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <DailyFlowTable data={data} />
        </div>
      ) : null}
    </div>
  );
}
