"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { previewCSV, parseCSV, type CSVColumnMapping } from "@/lib/csv-parser";
import type { ParsedTransaction } from "@/lib/ofx-parser";

interface ImportCSVMappingProps {
  csvContent: string;
  onMapped: (transactions: ParsedTransaction[], warnings: string[]) => void;
  onBack: () => void;
}

const DATE_PATTERNS = ["data", "date", "dt", "dia"];
const AMOUNT_PATTERNS = ["valor", "amount", "value", "vlr", "quantia"];
const DESC_PATTERNS = [
  "descri\u00e7\u00e3o",
  "descricao",
  "description",
  "memo",
  "historico",
  "hist\u00f3rico",
  "detalhe",
];
const TYPE_PATTERNS = ["tipo", "type", "natureza", "d/c", "dc"];

function autoDetectColumn(headers: string[], patterns: string[]): number {
  const normalized = headers.map((h) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  );

  for (const pattern of patterns) {
    const normalizedPattern = pattern
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const idx = normalized.findIndex((h) => h.includes(normalizedPattern));
    if (idx !== -1) return idx;
  }

  return -1;
}

export function ImportCSVMapping({
  csvContent,
  onMapped,
  onBack,
}: ImportCSVMappingProps) {
  const preview = useMemo(() => previewCSV(csvContent), [csvContent]);

  const [dateCol, setDateCol] = useState<number>(() =>
    autoDetectColumn(preview.headers, DATE_PATTERNS)
  );
  const [amountCol, setAmountCol] = useState<number>(() =>
    autoDetectColumn(preview.headers, AMOUNT_PATTERNS)
  );
  const [descCol, setDescCol] = useState<number>(() =>
    autoDetectColumn(preview.headers, DESC_PATTERNS)
  );
  const [typeCol, setTypeCol] = useState<number>(() =>
    autoDetectColumn(preview.headers, TYPE_PATTERNS)
  );

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = dateCol >= 0 && amountCol >= 0 && descCol >= 0;

  function handleProcess() {
    if (!isValid) return;

    setProcessing(true);
    setError(null);

    try {
      const mapping: CSVColumnMapping = {
        date: dateCol,
        amount: amountCol,
        description: descCol,
      };

      if (typeCol >= 0) {
        mapping.type = typeCol;
      }

      const result = parseCSV(csvContent, mapping);

      if (!result.success) {
        setError(result.errors.join(" "));
        setProcessing(false);
        return;
      }

      onMapped(result.transactions, result.errors);
    } catch {
      setError("Erro ao processar o CSV.");
    } finally {
      setProcessing(false);
    }
  }

  const columnOptions = preview.headers.map((h, i) => ({
    value: i,
    label: h || `Coluna ${i + 1}`,
  }));

  if (preview.headers.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-red-600">
            Nenhum cabe\u00e7alho encontrado no arquivo CSV.
          </p>
          <Button variant="secondary" onClick={onBack} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            2. Mapeie as colunas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Identifique qual coluna do CSV corresponde a cada campo.
            {preview.totalRows > 0 && (
              <span className="ml-1">
                ({preview.totalRows} linha{preview.totalRows !== 1 ? "s" : ""}{" "}
                encontrada{preview.totalRows !== 1 ? "s" : ""}, delimitador:{" "}
                <code className="bg-slate-100 px-1 rounded">
                  {preview.delimiter === "\t" ? "TAB" : preview.delimiter}
                </code>
                )
              </span>
            )}
          </p>
        </div>

        {/* Preview table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {preview.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left font-medium text-slate-700 border-b border-slate-200 whitespace-nowrap"
                  >
                    {h || <span className="text-slate-400">Coluna {i + 1}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                >
                  {preview.headers.map((_, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-1.5 text-slate-600 border-b border-slate-100 whitespace-nowrap"
                    >
                      {row[ci] || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Column mapping dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MappingSelect
            label="Coluna de data *"
            value={dateCol}
            onChange={setDateCol}
            options={columnOptions}
            required
          />
          <MappingSelect
            label="Coluna de valor *"
            value={amountCol}
            onChange={setAmountCol}
            options={columnOptions}
            required
          />
          <MappingSelect
            label="Coluna de descri\u00e7\u00e3o *"
            value={descCol}
            onChange={setDescCol}
            options={columnOptions}
            required
          />
          <MappingSelect
            label="Coluna de tipo"
            value={typeCol}
            onChange={setTypeCol}
            options={columnOptions}
            optional
          />
        </div>

        {!isValid && (
          <p className="text-sm text-amber-600">
            Selecione as colunas obrigat\u00f3rias (data, valor e descri\u00e7\u00e3o) para continuar.
          </p>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="secondary" onClick={onBack}>
            Voltar
          </Button>
          <Button
            variant="primary"
            disabled={!isValid || processing}
            loading={processing}
            onClick={handleProcess}
          >
            Processar
          </Button>
        </div>
      </div>
    </div>
  );
}

function MappingSelect({
  label,
  value,
  onChange,
  options,
  required,
  optional,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <select
        className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
          required && value < 0
            ? "border-amber-300 text-slate-900"
            : "border-slate-300 text-slate-900"
        }`}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      >
        <option value={-1}>
          {optional ? "N\u00e3o mapear" : "Selecione..."}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
