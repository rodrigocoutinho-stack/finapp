/**
 * Competency override — permite lançar uma transação com data de pagamento
 * em um mês e competência contábil em outro (ex.: conta de abril paga em maio).
 *
 * Regra:
 *   - Se `competency_month` da transação é NULL → a competência é derivada
 *     de `date` + `closing_day` do usuário (padrão).
 *   - Se `competency_month` está preenchido (formato YYYY-MM) → ele sobrepõe.
 */

import { getCurrentCompetencyMonth } from "@/lib/closing-day";

/** Formato YYYY-MM a partir de uma data ISO e do closing_day. */
export function deriveCompetencyMonth(dateStr: string, closingDay: number): string {
  const d = new Date(dateStr + "T00:00:00");
  const { year, month } = getCurrentCompetencyMonth(closingDay, d);
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** Competência efetiva: override > derivação. */
export function getEffectiveCompetency(
  txDate: string,
  competencyMonth: string | null,
  closingDay: number
): string {
  if (competencyMonth) return competencyMonth;
  return deriveCompetencyMonth(txDate, closingDay);
}

/** Converte (year, month 0-based) para a string YYYY-MM usada em queries. */
export function toCompetencyLabel(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * Monta a cláusula .or() do PostgREST para buscar transações de uma competência.
 *
 * Lógica:
 *   (competency_month = 'YYYY-MM')
 *     OR
 *   (competency_month IS NULL AND date BETWEEN start AND end)
 *
 * Retorna a string no formato aceito por supabase .or():
 *   "competency_month.eq.YYYY-MM,and(competency_month.is.null,date.gte.X,date.lte.Y)"
 */
export function buildCompetencyOrFilter(
  competencyLabel: string,
  start: string,
  end: string
): string {
  return `competency_month.eq.${competencyLabel},and(competency_month.is.null,date.gte.${start},date.lte.${end})`;
}
