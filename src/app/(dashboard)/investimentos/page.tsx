"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { InvestmentForm } from "@/components/investimentos/investment-form";
import { InvestmentList } from "@/components/investimentos/investment-list";
import { InvestmentDashboard } from "@/components/investimentos/investment-dashboard";
import type { Investment, Account } from "@/types/database";

type Tab = "carteira" | "evolucao";

export default function InvestimentosPage() {
  const supabase = createClient();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<Tab>("carteira");

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [invRes, accRes] = await Promise.all([
      supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("accounts")
        .select("*")
        .order("name", { ascending: true }),
    ]);

    setInvestments((invRes.data as Investment[]) ?? []);
    setAccounts((accRes.data as Account[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? "bg-emerald-100 text-emerald-700"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investimentos</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie sua carteira de investimentos
          </p>
        </div>
        {tab === "carteira" && !loading && (
          accounts.length > 0 ? (
            <Button onClick={() => setShowForm(true)}>Novo investimento</Button>
          ) : (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              Cadastre uma conta antes de criar investimentos
            </span>
          )
        )}
      </div>

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
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : tab === "carteira" ? (
        <InvestmentList
          investments={investments}
          accounts={accounts}
          onRefresh={fetchData}
        />
      ) : (
        <InvestmentDashboard investments={investments} />
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
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
