let cachedIPCA: number | null | undefined = undefined;

/**
 * Busca IPCA acumulado 12 meses via API do Banco Central (série 13522).
 * Cache em variável — não re-busca durante a sessão.
 */
export async function getIPCA12Months(): Promise<number | null> {
  if (cachedIPCA !== undefined) return cachedIPCA;

  try {
    const res = await fetch(
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/12?formato=json",
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      cachedIPCA = null;
      return null;
    }

    const data: { valor: string }[] = await res.json();

    // Acumula os 12 meses: ((1+v1/100) * (1+v2/100) * ... - 1) * 100
    let accumulated = 1;
    for (const item of data) {
      const monthly = parseFloat(item.valor.replace(",", "."));
      accumulated *= 1 + monthly / 100;
    }

    cachedIPCA = (accumulated - 1) * 100;
    return cachedIPCA;
  } catch {
    cachedIPCA = null;
    return null;
  }
}

/**
 * Calcula retorno real: ((1 + nominal/100) / (1 + ipca/100) - 1) * 100
 */
export function calcRealReturn(nominalPercent: number, ipcaPercent: number): number {
  return ((1 + nominalPercent / 100) / (1 + ipcaPercent / 100) - 1) * 100;
}
