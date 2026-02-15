import { formatCurrency } from "@/lib/utils";
import {
  getProductLabel,
  getIndexerLabel,
  calculateInvestmentBalance,
} from "@/lib/investment-utils";
import type {
  Account,
  Category,
  Transaction,
  RecurringTransaction,
  Investment,
  InvestmentEntry,
} from "@/types/database";
import type { MonthForecast } from "@/lib/forecast";

interface FinancialData {
  fullName: string;
  closingDay: number;
  accounts: Account[];
  categories: Category[];
  recentTransactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  forecast: MonthForecast[];
  investments: Investment[];
  investmentEntries: InvestmentEntry[];
}

export function buildFinancialContext(data: FinancialData): string {
  const sections: string[] = [];
  const today = new Date().toISOString().split("T")[0];

  sections.push(`USUÁRIO: ${data.fullName || "Não informado"}`);
  sections.push(`DATA: ${today}`);
  sections.push(`DIA DE FECHAMENTO: ${data.closingDay}`);

  // --- CONTAS ---
  if (data.accounts.length > 0) {
    const accountLines = data.accounts.map(
      (a) => `- ${a.name} (${a.type}): ${formatCurrency(a.balance_cents)}`
    );
    const totalBalance = data.accounts.reduce(
      (sum, a) => sum + a.balance_cents,
      0
    );
    sections.push(
      `\n## CONTAS\n${accountLines.join("\n")}\nTotal: ${formatCurrency(totalBalance)}`
    );
  }

  // --- TRANSAÇÕES RECENTES (agrupadas por categoria) ---
  if (data.recentTransactions.length > 0) {
    const categoryMap = new Map<string, Category>();
    for (const cat of data.categories) {
      categoryMap.set(cat.id, cat);
    }

    const grouped = new Map<
      string,
      { type: string; total: number; count: number }
    >();
    for (const t of data.recentTransactions) {
      const cat = categoryMap.get(t.category_id);
      const key = cat ? cat.name : "Sem categoria";
      const existing = grouped.get(key);
      if (existing) {
        existing.total += t.amount_cents;
        existing.count++;
      } else {
        grouped.set(key, {
          type: t.type,
          total: t.amount_cents,
          count: 1,
        });
      }
    }

    const receitas: string[] = [];
    const despesas: string[] = [];
    for (const [name, info] of grouped) {
      const line = `- ${name}: ${formatCurrency(info.total)} (${info.count}x)`;
      if (info.type === "receita") {
        receitas.push(line);
      } else {
        despesas.push(line);
      }
    }

    let transSection = "\n## TRANSAÇÕES RECENTES (últimos 60 dias)";
    if (receitas.length > 0) {
      const totalRec = data.recentTransactions
        .filter((t) => t.type === "receita")
        .reduce((s, t) => s + t.amount_cents, 0);
      transSection += `\nReceitas (${formatCurrency(totalRec)}):\n${receitas.join("\n")}`;
    }
    if (despesas.length > 0) {
      const totalDesp = data.recentTransactions
        .filter((t) => t.type === "despesa")
        .reduce((s, t) => s + t.amount_cents, 0);
      transSection += `\nDespesas (${formatCurrency(totalDesp)}):\n${despesas.join("\n")}`;
    }
    sections.push(transSection);
  }

  // --- RECORRENTES ATIVAS ---
  if (data.recurringTransactions.length > 0) {
    const categoryMap = new Map<string, Category>();
    for (const cat of data.categories) {
      categoryMap.set(cat.id, cat);
    }

    const recLines = data.recurringTransactions.map((r) => {
      const cat = categoryMap.get(r.category_id);
      const catName = cat ? cat.name : "?";
      return `- ${r.description} (${catName}, dia ${r.day_of_month}): ${formatCurrency(r.amount_cents)} [${r.type}]`;
    });

    const totalRecReceitas = data.recurringTransactions
      .filter((r) => r.type === "receita")
      .reduce((s, r) => s + r.amount_cents, 0);
    const totalRecDespesas = data.recurringTransactions
      .filter((r) => r.type === "despesa")
      .reduce((s, r) => s + r.amount_cents, 0);

    sections.push(
      `\n## RECORRENTES ATIVAS\n${recLines.join("\n")}\nTotal receitas recorrentes: ${formatCurrency(totalRecReceitas)}\nTotal despesas recorrentes: ${formatCurrency(totalRecDespesas)}`
    );
  }

  // --- PROJEÇÃO (forecast) ---
  if (data.forecast.length > 0) {
    const forecastLines = data.forecast.map((m) => {
      let line = `- ${m.label}${m.isCurrentMonth ? " (atual)" : ""}:`;
      if (m.isCurrentMonth) {
        line += ` Realizado: Rec ${formatCurrency(m.realReceitas)} / Desp ${formatCurrency(m.realDespesas)}.`;
        line += ` Previsto: Rec ${formatCurrency(m.forecastReceitas)} / Desp ${formatCurrency(m.forecastDespesas)}.`;
      }
      line += ` Projetado: Rec ${formatCurrency(m.totalReceitas)} / Desp ${formatCurrency(m.totalDespesas)} / Saldo ${formatCurrency(m.saldo)}`;
      return line;
    });
    sections.push(`\n## PROJEÇÃO (${data.forecast.length} meses)\n${forecastLines.join("\n")}`);
  }

  // --- INVESTIMENTOS ---
  if (data.investments.length > 0) {
    const entryMap = new Map<string, InvestmentEntry[]>();
    for (const e of data.investmentEntries) {
      const list = entryMap.get(e.investment_id) || [];
      list.push(e);
      entryMap.set(e.investment_id, list);
    }

    const invLines = data.investments.map((inv) => {
      const entries = entryMap.get(inv.id) || [];
      const balance = calculateInvestmentBalance(entries, today);
      const product = getProductLabel(inv.product);
      const indexer = getIndexerLabel(inv.indexer);
      const rate = inv.rate ? ` ${inv.rate}` : "";
      return `- ${inv.name}: ${product} (${indexer}${rate}) — Saldo: ${formatCurrency(balance)}${inv.is_active ? "" : " [INATIVO]"}`;
    });

    const totalInv = data.investments.reduce((sum, inv) => {
      const entries = entryMap.get(inv.id) || [];
      return sum + calculateInvestmentBalance(entries, today);
    }, 0);

    sections.push(
      `\n## INVESTIMENTOS\n${invLines.join("\n")}\nTotal investido: ${formatCurrency(totalInv)}`
    );
  }

  return sections.join("\n");
}
