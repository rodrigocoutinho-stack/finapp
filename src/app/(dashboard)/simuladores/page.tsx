"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { CompoundInterestSimulator } from "@/components/simuladores/compound-interest-simulator";
import { InflationSimulator } from "@/components/simuladores/inflation-simulator";
import { OpportunityCostSimulator } from "@/components/simuladores/opportunity-cost-simulator";
import { FISimulator } from "@/components/simuladores/fi-simulator";

type Tab = "juros" | "inflacao" | "oportunidade" | "fi";

const tabs: { key: Tab; label: string; description: string }[] = [
  { key: "juros", label: "Juros Compostos", description: "Simule o crescimento do seu patrimônio com aportes regulares" },
  { key: "inflacao", label: "Inflação", description: "Veja como a inflação corrói o poder de compra do seu dinheiro" },
  { key: "oportunidade", label: "Custo de Oportunidade", description: "Descubra o custo real dos seus gastos recorrentes" },
  { key: "fi", label: "Independência Financeira", description: "Calcule quanto você precisa para viver de renda e quando pode chegar lá" },
];

export default function SimuladoresPage() {
  const [tab, setTab] = useState<Tab>("juros");

  return (
    <div>
      <PageHeader
        title="Simuladores"
        description={tabs.find((t) => t.key === tab)?.description ?? ""}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-tab-bg rounded-lg p-1 mb-6 w-fit flex-wrap">
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

      {/* Content */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        {tab === "juros" && <CompoundInterestSimulator />}
        {tab === "inflacao" && <InflationSimulator />}
        {tab === "oportunidade" && <OpportunityCostSimulator />}
        {tab === "fi" && <FISimulator />}
      </div>
    </div>
  );
}
