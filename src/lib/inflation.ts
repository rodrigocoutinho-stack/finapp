const IPCA_CACHE_KEY = "finapp_ipca_12m";
const IPCA_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let memoryCache: number | null | undefined = undefined;

function getFromLocalStorage(): number | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(IPCA_CACHE_KEY);
    if (!raw) return undefined;
    const { value, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > IPCA_CACHE_TTL) return undefined;
    return value as number | null;
  } catch {
    return undefined;
  }
}

function saveToLocalStorage(value: number | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(IPCA_CACHE_KEY, JSON.stringify({ value, timestamp: Date.now() }));
  } catch {
    // localStorage may be full or disabled
  }
}

/**
 * Busca IPCA acumulado 12 meses via API do Banco Central (série 13522).
 * Cache: memória (sessão) + localStorage (24h TTL).
 */
export async function getIPCA12Months(): Promise<number | null> {
  // 1. Memory cache (instant)
  if (memoryCache !== undefined) return memoryCache;

  // 2. localStorage cache (survives page reload)
  const stored = getFromLocalStorage();
  if (stored !== undefined) {
    memoryCache = stored;
    return stored;
  }

  // 3. Fetch from BCB API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // reduced from 10s to 5s

    const res = await fetch(
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/12?formato=json",
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      memoryCache = null;
      saveToLocalStorage(null);
      return null;
    }

    const data: { valor: string }[] = await res.json();

    // Acumula os 12 meses: ((1+v1/100) * (1+v2/100) * ... - 1) * 100
    let accumulated = 1;
    for (const item of data) {
      const monthly = parseFloat(item.valor.replace(",", "."));
      accumulated *= 1 + monthly / 100;
    }

    const result = (accumulated - 1) * 100;
    memoryCache = result;
    saveToLocalStorage(result);
    return result;
  } catch {
    memoryCache = null;
    saveToLocalStorage(null);
    return null;
  }
}

/**
 * Calcula retorno real: ((1 + nominal/100) / (1 + ipca/100) - 1) * 100
 */
export function calcRealReturn(nominalPercent: number, ipcaPercent: number): number {
  return ((1 + nominalPercent / 100) / (1 + ipcaPercent / 100) - 1) * 100;
}
