import type { OFXParseResult } from "@/lib/ofx-parser";

export async function parsePDFImport(file: File, password?: string): Promise<OFXParseResult> {
  const formData = new FormData();
  formData.append("pdf", file);
  if (password) {
    formData.append("password", password);
  }

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
