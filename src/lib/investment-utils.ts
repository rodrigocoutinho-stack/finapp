import type { Investment, InvestmentEntry } from "@/types/database";

export type InvestmentGroup =
  | "pos_fixado"
  | "pre_fixado"
  | "inflacao"
  | "renda_variavel"
  | "fundos"
  | "outros";

export const productOptions = [
  { value: "cdb", label: "CDB" },
  { value: "lci_lca", label: "LCI/LCA" },
  { value: "tesouro_selic", label: "Tesouro Selic" },
  { value: "tesouro_prefixado", label: "Tesouro Pré" },
  { value: "tesouro_ipca", label: "Tesouro IPCA+" },
  { value: "fundo", label: "Fundo" },
  { value: "acao", label: "Ação" },
  { value: "fii", label: "FII" },
  { value: "cri_cra", label: "CRI/CRA" },
  { value: "debenture", label: "Debênture" },
  { value: "outro", label: "Outro" },
] as const;

export const indexerOptions = [
  { value: "cdi", label: "CDI" },
  { value: "prefixado", label: "Pré-fixado" },
  { value: "ipca", label: "IPCA+" },
  { value: "selic", label: "Selic" },
  { value: "ibovespa", label: "Ibovespa" },
  { value: "outro", label: "Outro" },
] as const;

export const entryTypeOptions = [
  { value: "aporte", label: "Aporte" },
  { value: "resgate", label: "Resgate" },
  { value: "saldo", label: "Saldo" },
] as const;

const productLabels: Record<Investment["product"], string> = {
  cdb: "CDB",
  lci_lca: "LCI/LCA",
  tesouro_selic: "Tesouro Selic",
  tesouro_prefixado: "Tesouro Pré",
  tesouro_ipca: "Tesouro IPCA+",
  fundo: "Fundo",
  acao: "Ação",
  fii: "FII",
  cri_cra: "CRI/CRA",
  debenture: "Debênture",
  outro: "Outro",
};

const indexerLabels: Record<Investment["indexer"], string> = {
  cdi: "CDI",
  prefixado: "Pré-fixado",
  ipca: "IPCA+",
  selic: "Selic",
  ibovespa: "Ibovespa",
  outro: "Outro",
};

const groupLabels: Record<InvestmentGroup, string> = {
  pos_fixado: "Pós-fixado (CDI/Selic)",
  pre_fixado: "Pré-fixado",
  inflacao: "Inflação (IPCA+)",
  renda_variavel: "Renda Variável",
  fundos: "Fundos",
  outros: "Outros",
};

export function getProductLabel(product: Investment["product"]): string {
  return productLabels[product];
}

export function getIndexerLabel(indexer: Investment["indexer"]): string {
  return indexerLabels[indexer];
}

export function getGroupLabel(group: InvestmentGroup): string {
  return groupLabels[group];
}

export function getInvestmentGroup(
  product: Investment["product"],
  indexer: Investment["indexer"]
): InvestmentGroup {
  // Renda Variável
  if (product === "acao" || product === "fii") return "renda_variavel";

  // Fundos
  if (product === "fundo") return "fundos";

  // IPCA+
  if (indexer === "ipca") return "inflacao";

  // Pré-fixado
  if (indexer === "prefixado") return "pre_fixado";

  // Pós-fixado (CDI/Selic)
  if (indexer === "cdi" || indexer === "selic") return "pos_fixado";

  return "outros";
}

/**
 * Calcula o saldo de um investimento até uma data.
 * Se existe um registro de `saldo` <= upToDate, usa o último.
 * Senão, soma aportes - resgates.
 */
export function calculateInvestmentBalance(
  entries: InvestmentEntry[],
  upToDate: string
): number {
  const filtered = entries.filter((e) => e.date <= upToDate);

  // Procura o último saldo registrado
  const saldos = filtered
    .filter((e) => e.type === "saldo")
    .sort((a, b) => b.date.localeCompare(a.date));

  if (saldos.length > 0) {
    return saldos[0].amount_cents;
  }

  // Sem saldo registrado: soma aportes - resgates
  let balance = 0;
  for (const entry of filtered) {
    if (entry.type === "aporte") {
      balance += entry.amount_cents;
    } else if (entry.type === "resgate") {
      balance -= entry.amount_cents;
    }
  }
  return Math.max(0, balance);
}

/**
 * Retorna o saldo de um investimento no último dia de um mês (YYYY-MM).
 */
export function getMonthEndBalance(
  entries: InvestmentEntry[],
  yearMonth: string
): number {
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const upToDate = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
  return calculateInvestmentBalance(entries, upToDate);
}

/** Todas as chaves de grupo na ordem de exibição */
export const groupOrder: InvestmentGroup[] = [
  "pos_fixado",
  "pre_fixado",
  "inflacao",
  "renda_variavel",
  "fundos",
  "outros",
];
