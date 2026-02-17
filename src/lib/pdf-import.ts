import type { OFXParseResult } from "@/lib/ofx-parser";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g. "data:application/pdf;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export async function parsePDFImport(file: File): Promise<OFXParseResult> {
  const base64 = await fileToBase64(file);

  const res = await fetch("/api/import/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdf_base64: base64 }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const msg = data?.error ?? `Erro do servidor (${res.status}).`;
    return { success: false, transactions: [], errors: [msg] };
  }

  const data: OFXParseResult = await res.json();
  return data;
}
