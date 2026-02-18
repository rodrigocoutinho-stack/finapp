import type { Transaction, RecurringTransaction } from "@/types/database";

export interface RecurrenceSuggestion {
  description: string;
  avgAmountCents: number;
  type: "receita" | "despesa";
  occurrences: number;
  estimatedDay: number;
}

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detects potential recurring transactions by grouping by normalized description
 * and checking if they appear in 2+ distinct months with similar amounts (±10%).
 */
export function detectRecurrences(
  transactions: Transaction[],
  existingRecurrings: RecurringTransaction[]
): RecurrenceSuggestion[] {
  // Group transactions by normalized description
  const groups = new Map<
    string,
    { original: string; type: "receita" | "despesa"; entries: { amount_cents: number; date: string }[] }
  >();

  for (const t of transactions) {
    const key = normalizeDescription(t.description);
    if (!groups.has(key)) {
      groups.set(key, { original: t.description, type: t.type, entries: [] });
    }
    const group = groups.get(key)!;
    group.entries.push({ amount_cents: t.amount_cents, date: t.date });
  }

  // Normalize existing recurring descriptions for comparison
  const existingKeys = new Set(
    existingRecurrings.map((r) => normalizeDescription(r.description))
  );

  const suggestions: RecurrenceSuggestion[] = [];

  for (const [key, group] of groups) {
    // Skip if already exists as a recurring
    if (existingKeys.has(key)) continue;

    // Need entries in at least 2 distinct months
    const months = new Set(group.entries.map((e) => e.date.substring(0, 7)));
    if (months.size < 2) continue;

    // Check amount consistency (all within ±10% of average)
    const avgAmount =
      group.entries.reduce((sum, e) => sum + e.amount_cents, 0) / group.entries.length;

    if (avgAmount <= 0) continue;

    const isConsistent = group.entries.every(
      (e) => Math.abs(e.amount_cents - avgAmount) / avgAmount <= 0.1
    );
    if (!isConsistent) continue;

    // Estimate day of month (most frequent day)
    const dayCounts = new Map<number, number>();
    for (const e of group.entries) {
      const day = parseInt(e.date.substring(8, 10), 10);
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    }
    let estimatedDay = 1;
    let maxCount = 0;
    for (const [day, count] of dayCounts) {
      if (count > maxCount) {
        maxCount = count;
        estimatedDay = day;
      }
    }

    suggestions.push({
      description: group.original,
      avgAmountCents: Math.round(avgAmount),
      type: group.type,
      occurrences: group.entries.length,
      estimatedDay,
    });
  }

  // Sort by occurrences (most frequent first)
  suggestions.sort((a, b) => b.occurrences - a.occurrences);

  return suggestions.slice(0, 5);
}
