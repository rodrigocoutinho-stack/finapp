"use client";

import { useRef, useState } from "react";
import { Select } from "@/components/ui/select";
import { parseOFX, type OFXParseResult } from "@/lib/ofx-parser";
import type { Account } from "@/types/database";

interface ImportUploadProps {
  accounts: Account[];
  onParsed: (result: OFXParseResult, accountId: string) => void;
  onCSVLoaded: (content: string, accountId: string) => void;
}

export function ImportUpload({ accounts, onParsed, onCSVLoaded }: ImportUploadProps) {
  const [accountId, setAccountId] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name} (${a.type})`,
  }));

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!accountId) {
      setError("Selecione uma conta antes de enviar o arquivo.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const ext = file.name.toLowerCase();
    const isOFX = ext.endsWith(".ofx") || ext.endsWith(".qfx");
    const isCSV = ext.endsWith(".csv");

    if (!isOFX && !isCSV) {
      setError("Formato inv\u00e1lido. Selecione um arquivo .ofx, .qfx ou .csv.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo excede o limite de 5MB.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setError(null);
    setParsing(true);

    try {
      const content = await file.text();

      if (isCSV) {
        onCSVLoaded(content, accountId);
        return;
      }

      const result = parseOFX(content);

      if (!result.success) {
        setError(result.errors.join(" "));
        if (fileRef.current) fileRef.current.value = "";
        setParsing(false);
        return;
      }

      onParsed(result, accountId);
    } catch {
      setError("Erro ao ler o arquivo. Verifique se o formato \u00e9 v\u00e1lido.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            1. Selecione a conta e o arquivo
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Escolha a conta de destino e envie o extrato do seu banco (OFX, QFX ou CSV).
          </p>
        </div>

        <Select
          label="Conta de destino"
          id="import-account"
          options={accountOptions}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="Selecione uma conta..."
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Arquivo OFX/QFX/CSV
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".ofx,.qfx,.csv"
            onChange={handleFileChange}
            disabled={parsing}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
          />
        </div>

        {parsing && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600" />
            Processando arquivo...
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 space-y-1">
          <p><strong>Formatos aceitos:</strong> .ofx, .qfx, .csv</p>
          <p><strong>Limite:</strong> 5MB por arquivo</p>
          <p><strong>CSV:</strong> o arquivo deve ter cabe\u00e7alho na primeira linha</p>
          <p><strong>Bancos testados:</strong> Ita\u00fa, Bradesco, Nubank e outros</p>
        </div>
      </div>
    </div>
  );
}
