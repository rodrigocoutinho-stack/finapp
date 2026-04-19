"use client";

import { useRef, useState } from "react";
import { Select } from "@/components/ui/select";
import { parseOFX, type OFXParseResult } from "@/lib/ofx-parser";
import { buildGroupedAccountOptions } from "@/lib/utils";
import type { Account } from "@/types/database";

interface ImportUploadProps {
  accounts: Account[];
  onParsed: (result: OFXParseResult, accountId: string) => void;
  onCSVLoaded: (content: string, accountId: string) => void;
  onPDFLoaded: (file: File, accountId: string, password?: string) => void;
}

export function ImportUpload({ accounts, onParsed, onCSVLoaded, onPDFLoaded }: ImportUploadProps) {
  const [accountId, setAccountId] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const importLabelFn = (a: Account) => `${a.name} (${a.type})`;
  const { options: accountOptions, groupedOptions: accountGrouped } = buildGroupedAccountOptions(accounts, importLabelFn);

  function resetFile() {
    setPdfFile(null);
    setPdfPassword("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!accountId) {
      setError("Selecione uma conta antes de enviar o arquivo.");
      resetFile();
      return;
    }

    const ext = file.name.toLowerCase();
    const isOFX = ext.endsWith(".ofx") || ext.endsWith(".qfx");
    const isCSV = ext.endsWith(".csv");
    const isPDF = ext.endsWith(".pdf");

    if (!isOFX && !isCSV && !isPDF) {
      setError("Formato inválido. Selecione um arquivo .ofx, .qfx, .csv ou .pdf.");
      resetFile();
      return;
    }

    const sizeLimit = isPDF ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const sizeLimitLabel = isPDF ? "10MB" : "5MB";
    if (file.size > sizeLimit) {
      setError(`Arquivo excede o limite de ${sizeLimitLabel}.`);
      resetFile();
      return;
    }

    setError(null);

    // PDF: show confirmation panel (with optional password) before submitting
    if (isPDF) {
      setPdfFile(file);
      return;
    }

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
        resetFile();
        setParsing(false);
        return;
      }

      onParsed(result, accountId);
    } catch {
      setError("Erro ao ler o arquivo. Verifique se o formato é válido.");
    } finally {
      setParsing(false);
    }
  }

  function handlePDFSubmit() {
    if (!pdfFile || !accountId) return;
    setParsing(true);
    onPDFLoaded(pdfFile, accountId, pdfPassword || undefined);
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-emerald-800 dark:text-emerald-200">
            <p className="font-semibold mb-1">Prefira OFX/QFX sempre que possível</p>
            <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
              É o formato ideal: leitura instantânea, gratuita e 100% precisa — nada sai do seu dispositivo.
              A maioria dos bancos (Nubank, Itaú, Bradesco, Inter, BTG) oferece OFX tanto para extrato quanto
              para fatura de cartão, geralmente em &quot;Extratos&quot; ou &quot;Exportar&quot;.
              <br />
              Use PDF apenas quando o banco não disponibilizar OFX — a extração via IA é mais lenta
              e pode falhar em layouts incomuns.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">
            1. Selecione a conta e o arquivo
          </h2>
          <p className="text-sm text-on-surface-muted mt-1">
            Escolha a conta de destino e envie o extrato do seu banco (OFX, QFX, CSV ou PDF).
          </p>
        </div>

        <Select
          label="Conta de destino"
          id="import-account"
          options={accountGrouped ? undefined : accountOptions}
          groupedOptions={accountGrouped}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="Selecione uma conta..."
        />

        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Arquivo OFX/QFX/CSV/PDF
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".ofx,.qfx,.csv,.pdf"
            onChange={handleFileChange}
            disabled={parsing}
            className="block w-full text-sm text-on-surface-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 dark:bg-emerald-950 file:text-emerald-700 dark:text-emerald-300 hover:file:bg-emerald-100 disabled:opacity-50"
          />
        </div>

        {pdfFile && !parsing && (
          <div className="rounded-lg bg-surface-alt border border-border p-4 space-y-3">
            <p className="text-sm text-on-surface-secondary">
              <strong>PDF selecionado:</strong> {pdfFile.name}
            </p>
            <div>
              <label htmlFor="pdf-password" className="block text-sm font-medium text-on-surface-secondary mb-1">
                Senha do PDF <span className="text-on-surface-muted font-normal">(opcional)</span>
              </label>
              <input
                id="pdf-password"
                type="password"
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value)}
                maxLength={50}
                placeholder="CPF, últimos dígitos do cartão, etc."
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePDFSubmit();
                }}
              />
              <p className="text-xs text-on-surface-muted mt-1">
                Faturas de cartão geralmente usam CPF ou últimos dígitos do cartão como senha.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePDFSubmit}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Enviar PDF para extração
            </button>
          </div>
        )}

        {parsing && (
          <div className="flex items-center gap-2 text-sm text-on-surface-secondary">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600" />
            Processando arquivo...
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-lg bg-surface-alt border border-border p-3 text-xs text-on-surface-muted space-y-1">
          <p><strong>Formatos aceitos:</strong> .ofx, .qfx, .csv, .pdf</p>
          <p><strong>Limite:</strong> 5MB (OFX/CSV) ou 10MB (PDF)</p>
          <p><strong>CSV:</strong> o arquivo deve ter cabeçalho na primeira linha</p>
          <p><strong>PDF:</strong> faturas de cartão e extratos — extração via IA (suporta PDFs com senha)</p>
          <p><strong>Bancos testados:</strong> Itaú, Bradesco, Nubank e outros</p>
        </div>
      </div>
    </div>
  );
}
