import type { OFXParseResult } from "@/lib/ofx-parser";

export async function parsePDFImport(file: File): Promise<OFXParseResult> {
  const formData = new FormData();
  formData.append("pdf", file);

  const res = await fetch("/api/import/pdf", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const msg = data?.error ?? `Erro do servidor (${res.status}).`;
    return { success: false, transactions: [], errors: [msg] };
  }

  const data: OFXParseResult = await res.json();
  return data;
}
