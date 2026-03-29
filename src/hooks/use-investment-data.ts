"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMonthEndBalance } from "@/lib/investment-utils";
import { getIPCA12Months } from "@/lib/inflation";
import type { InvestmentEntry } from "@/types/database";

export interface InvestmentData {
  totalBalance: number;
  lastReturn: number;
  lastReturnPercent: number;
  hasData: boolean;
}

const INITIAL_DATA: InvestmentData = {
  totalBalance: 0,
  lastReturn: 0,
  lastReturnPercent: 0,
  hasData: false,
};

export function useInvestmentData() {
  const supabase = createClient();
  const [investmentData, setInvestmentData] = useState<InvestmentData>(INITIAL_DATA);
  const [ipca12m, setIpca12m] = useState<number | null>(null);

  useEffect(() => {
    async function fetchInvestments() {
      try {
        const [investmentsRes, entriesRes, ipca] = await Promise.all([
          supabase
            .from("investments")
            .select("id, product, indexer")
            .eq("is_active", true),
          supabase
            .from("investment_entries")
            .select("investment_id, type, amount_cents, date")
            .limit(5000),
          getIPCA12Months(),
        ]);

        const investments = (investmentsRes.data ?? []) as { id: string; product: string; indexer: string }[];
        const entries = (entriesRes.data ?? []) as InvestmentEntry[];
        setIpca12m(ipca);

        if (investments.length === 0) {
          setInvestmentData(INITIAL_DATA);
          return;
        }

        const today = new Date();
        const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
        const prevMonthD = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevYM = `${prevMonthD.getFullYear()}-${String(prevMonthD.getMonth() + 1).padStart(2, "0")}`;

        let totalBalance = 0;
        let totalPrevMonth = 0;

        for (const inv of investments) {
          const invEntries = entries.filter((e) => e.investment_id === inv.id);
          totalBalance += getMonthEndBalance(invEntries, currentYM);
          totalPrevMonth += getMonthEndBalance(invEntries, prevYM);
        }

        const lastReturn = totalBalance - totalPrevMonth;
        const lastReturnPercent = totalPrevMonth > 0
          ? ((totalBalance / totalPrevMonth) - 1) * 100
          : 0;

        setInvestmentData({ totalBalance, lastReturn, lastReturnPercent, hasData: true });
      } catch (err) {
        console.error("Erro ao carregar investimentos:", err);
      }
    }

    fetchInvestments();
  }, []);

  return { investmentData, ipca12m };
}
