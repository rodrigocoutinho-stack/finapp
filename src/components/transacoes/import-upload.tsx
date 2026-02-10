"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { parseOFX, type OFXParseResult } from "@/lib/ofx-parser";
import type { Account } from "@/types/database";

interface ImportUploadProps {
  accounts: Account[];
  onParsed: (result: OFXParseResult, accountId: string) => void;
}

export function ImportUpload({ accounts, onParsed }: ImportUploadProps) {
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
    if (!ext.endsWith(".ofx") && !ext.endsWith(".qfx")) {
      setError("Formato inválido. Selecione um arquivo .ofx ou .qfx.");
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
      const result = parseOFX(content);

      if (!result.success) {
        setError(result.errors.join(" "));
        if (fileRef.current) fileRef.current.value = "";
        setParsing(false);
        return;
      }

      onParsed(result, accountId);
    } catch {
      setError("Erro ao ler o arquivo. Verifique se é um OFX válido.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            1. Selecione a conta e o arquivo
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Escolha a conta de destino e envie o extrato OFX/QFX do seu banco.
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arquivo OFX/QFX
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".ofx,.qfx"
            onChange={handleFileChange}
            disabled={parsing}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
          />
        </div>

        {parsing && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600" />
            Processando arquivo...
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500 space-y-1">
          <p><strong>Formatos aceitos:</strong> .ofx, .qfx</p>
          <p><strong>Limite:</strong> 5MB por arquivo</p>
          <p><strong>Bancos testados:</strong> Itaú, Bradesco, Nubank e outros</p>
        </div>
      </div>
    </div>
  );
}
