/**
 * Sugestão de categoria por histórico — usa transações já categorizadas
 * pelo próprio usuário para propor categoria ao importar.
 *
 * Estratégia: extrair 1 ou 2 tokens significativos da descrição, indexar
 * as transações históricas por esses tokens, e para cada transação nova
 * sugerir a categoria mais frequente entre matches com score >= 2.
 */

/**
 * Extrai tokens normalizados de uma descrição.
 * Foca nas 2 primeiras palavras "limpas" (só letras), lowercase,
 * ignorando palavras muito curtas (<2 chars).
 *
 * Exemplos:
 *   "UBER*TRIP 123ABC"           → ["uber", "trip"]
 *   "IFD*IFOOD 456"              → ["ifd", "ifood"]
 *   "SUPERMERCADO EXTRA 21/04"   → ["supermercado", "extra"]
 *   "NETFLIX.COM SAO PAULO BR"   → ["netflix", "com"]
 *   "POST SHELL"                 → ["post", "shell"]
 */
export function extractTokens(description: string, maxTokens: number = 2): string[] {
  if (!description) return [];
  const normalized = description
    .toLowerCase()
    .replace(/[^a-zàáâãäéêíóôõúüç\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return [];
  const words = normalized.split(" ").filter((w) => w.length >= 2);
  return words.slice(0, maxTokens);
}

/**
 * Gera chave de indexação a partir dos tokens.
 */
function tokensKey(tokens: string[]): string {
  return tokens.join("|");
}

export interface HistoricalTxn {
  description: string;
  category_id: string | null;
  type?: "receita" | "despesa" | "transferencia";
}

export interface SuggestionIndex {
  lookup: (description: string, type?: "receita" | "despesa") => string | null;
  /** Tamanho do índice (para diagnóstico/testes) */
  size: number;
}

/**
 * Constrói índice em memória a partir do histórico. Retorna função `lookup`
 * que devolve o category_id mais frequente para uma descrição nova.
 */
export function buildSuggestionIndex(history: HistoricalTxn[]): SuggestionIndex {
  // chave = tokens + type (para evitar cruzar despesa com receita)
  // valor = Map<category_id, count>
  const indexByTwoTokens = new Map<string, Map<string, number>>();
  const indexByOneToken = new Map<string, Map<string, number>>();

  for (const t of history) {
    if (!t.category_id || t.type === "transferencia") continue;
    const tokens = extractTokens(t.description, 2);
    if (tokens.length === 0) continue;

    const typeTag = t.type ?? "any";

    if (tokens.length === 2) {
      const k = `${typeTag}::${tokensKey(tokens)}`;
      const inner = indexByTwoTokens.get(k) ?? new Map<string, number>();
      inner.set(t.category_id, (inner.get(t.category_id) ?? 0) + 1);
      indexByTwoTokens.set(k, inner);
    }

    // Sempre indexa também por 1 token (fallback)
    const k1 = `${typeTag}::${tokens[0]}`;
    const inner1 = indexByOneToken.get(k1) ?? new Map<string, number>();
    inner1.set(t.category_id, (inner1.get(t.category_id) ?? 0) + 1);
    indexByOneToken.set(k1, inner1);
  }

  function pickTop(map: Map<string, number> | undefined, minCount: number): string | null {
    if (!map) return null;
    let bestId: string | null = null;
    let bestCount = 0;
    for (const [id, count] of map) {
      if (count > bestCount) {
        bestCount = count;
        bestId = id;
      }
    }
    return bestCount >= minCount ? bestId : null;
  }

  return {
    size: indexByTwoTokens.size + indexByOneToken.size,
    lookup: (description, type) => {
      const tokens = extractTokens(description, 2);
      if (tokens.length === 0) return null;
      const typeTag = type ?? "any";

      // 1) Match exato com 2 tokens e type correspondente (score >= 2)
      if (tokens.length === 2) {
        const strict = pickTop(
          indexByTwoTokens.get(`${typeTag}::${tokensKey(tokens)}`),
          2
        );
        if (strict) return strict;
      }

      // 2) Fallback: 1 token + type (score >= 3 para reduzir falso positivo)
      const loose = pickTop(indexByOneToken.get(`${typeTag}::${tokens[0]}`), 3);
      if (loose) return loose;

      return null;
    },
  };
}
