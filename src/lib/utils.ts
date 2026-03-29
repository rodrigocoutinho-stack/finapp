import { getCompetencyRange } from "@/lib/closing-day";
import type { Account, Category } from "@/types/database";

/**
 * Agrupa contas por account_group. Contas sem grupo ficam em "Geral".
 * Retorna grupos nomeados em ordem alfabética, com "Geral" por último.
 */
export function groupAccountsByGroup(accounts: Account[]): [string, Account[]][] {
  const groups = new Map<string, Account[]>();
  for (const account of accounts) {
    const key = account.account_group ?? "Geral";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(account);
  }
  return [...groups.entries()].sort((a, b) => {
    if (a[0] === "Geral") return 1;
    if (b[0] === "Geral") return -1;
    return a[0].localeCompare(b[0]);
  });
}

/**
 * Constrói groupedOptions para o Select UI com optgroup, se houver 2+ grupos.
 * Retorna { options, groupedOptions } — usar groupedOptions quando definido.
 */
export function buildGroupedAccountOptions(
  accounts: Account[],
  labelFn: (a: Account) => string = (a) => a.name
): {
  options: { value: string; label: string }[];
  groupedOptions?: { group: string; options: { value: string; label: string }[] }[];
} {
  const grouped = groupAccountsByGroup(accounts);
  const options = accounts.map((a) => ({ value: a.id, label: labelFn(a) }));
  if (grouped.length <= 1) return { options };
  return {
    options,
    groupedOptions: grouped.map(([group, accts]) => ({
      group,
      options: accts.map((a) => ({ value: a.id, label: labelFn(a) })),
    })),
  };
}

/**
 * Agrupa categorias por category_group. Categorias sem grupo ficam em "Geral".
 * Retorna grupos nomeados em ordem alfabética, com "Geral" por último.
 */
export function groupCategoriesByGroup(categories: Category[]): [string, Category[]][] {
  const groups = new Map<string, Category[]>();
  for (const cat of categories) {
    const key = cat.category_group ?? "Geral";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(cat);
  }
  return [...groups.entries()].sort((a, b) => {
    if (a[0] === "Geral") return 1;
    if (b[0] === "Geral") return -1;
    return a[0].localeCompare(b[0]);
  });
}

/**
 * Constrói groupedOptions para o Select UI com optgroup, se houver 2+ grupos.
 */
export function buildGroupedCategoryOptions(
  categories: Category[],
  labelFn: (c: Category) => string = (c) => c.name
): {
  options: { value: string; label: string }[];
  groupedOptions?: { group: string; options: { value: string; label: string }[] }[];
} {
  const grouped = groupCategoriesByGroup(categories);
  const options = categories.map((c) => ({ value: c.id, label: labelFn(c) }));
  if (grouped.length <= 1) return { options };
  return {
    options,
    groupedOptions: grouped.map(([group, cats]) => ({
      group,
      options: cats.map((c) => ({ value: c.id, label: labelFn(c) })),
    })),
  };
}

/**
 * Formata centavos para moeda brasileira (R$).
 * Ex: 15050 → "R$ 150,50"
 */
export function formatCurrency(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte valor em reais (string ou number) para centavos.
 * Ex: "150,50" → 15050, 150.5 → 15050
 */
export function toCents(value: string | number): number {
  if (typeof value === "number") {
    const n = isNaN(value) ? 0 : value;
    return Math.round(n * 100);
  }
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

/**
 * Formata uma data para dd/mm/aaaa.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  return d.toLocaleDateString("pt-BR");
}

/**
 * Retorna o primeiro e último dia do mês no formato YYYY-MM-DD.
 * Quando closingDay > 1, delega para getCompetencyRange.
 */
export function getMonthRange(year: number, month: number, closingDay: number = 1) {
  if (closingDay > 1) {
    return getCompetencyRange(year, month, closingDay);
  }
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

/**
 * Retorna o nome do mês em pt-BR.
 */
export function getMonthName(month: number): string {
  const names = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return names[month];
}

/**
 * Formata "YYYY-MM" para "mmm/aaaa" (ex: "2026-04" → "abr/2026").
 */
/**
 * Verifica se uma transação recorrente está ativa em um dado mês (YYYY-MM).
 */
export function isRecurringActiveInMonth(
  recurring: { start_month: string | null; end_month: string | null },
  targetMonth: string
): boolean {
  const { start_month, end_month } = recurring;
  if (start_month && targetMonth < start_month) return false;
  if (end_month && targetMonth > end_month) return false;
  return true;
}

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const shortNames = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${shortNames[parseInt(month, 10) - 1]}/${year}`;
}
