"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { InvestmentForm } from "@/components/investimentos/investment-form";
import { InvestmentList } from "@/components/investimentos/investment-list";
import { InvestmentDashboard } from "@/components/investimentos/investment-dashboard";
import { useToast } from "@/contexts/toast-context";
import { getIPCA12Months } from "@/lib/inflation";
import type { Investment, Account } from "@/types/database";

type Tab = "carteira" | "evolucao";

export default function InvestimentosPage() {
  const supabase = createClient();
  const { addToast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<Tab>("carteira");
  const [ipca12m, setIpca12m] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [invRes, accRes, ipca] = await Promise.all([
      supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("accounts")
        .select("*")
        .order("name", { ascending: true }),
      getIPCA12Months(),
    ]);

    setInvestments((invRes.data as Investment[]) ?? []);
    setAccounts((accRes.data as Account[]) ?? []);
    setIpca12m(ipca);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? "bg-emerald-100 text-emerald-700"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <div>
      <PageHeader
        title="Investimentos"
        description="Gerencie sua carteira de investimentos"
        action={
          tab === "carteira" && !loading ? (
            accounts.length > 0 ? (
              <Button onClick={() => setShowForm(true)}>Novo investimento</Button>
            ) : (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                Cadastre uma conta antes de criar investimentos
              </span>
            )
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button className={tabClass("carteira")} onClick={() => setTab("carteira")}>
          Carteira
        </button>
        <button className={tabClass("evolucao")} onClick={() => setTab("evolucao")}>
          Evolução
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : tab === "carteira" ? (
        <InvestmentList
          investments={investments}
          accounts={accounts}
          onRefresh={fetchData}
        />
      ) : (
        <InvestmentDashboard investments={investments} ipca12m={ipca12m} />
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Novo investimento"
      >
        <InvestmentForm
          accounts={accounts}
          onSuccess={() => {
            setShowForm(false);
            fetchData();
            addToast("Investimento criado com sucesso.");
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
