"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ImportUpload } from "@/components/transacoes/import-upload";
import { ImportCSVMapping } from "@/components/transacoes/import-csv-mapping";
import { ImportReviewTable } from "@/components/transacoes/import-review-table";
import { ImportSummary } from "@/components/transacoes/import-summary";
import { parsePDFImport } from "@/lib/pdf-import";
import type { OFXParseResult, ParsedTransaction } from "@/lib/ofx-parser";
import type { Account, Category } from "@/types/database";

type Step = "upload" | "csv-mapping" | "review" | "summary";

interface ImportResult {
  imported: number;
  ignored: number;
  duplicates: number;
}

export default function ImportarPage() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Data passed between steps
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // CSV-specific state
  const [csvContent, setCSVContent] = useState<string>("");

  // PDF-specific state
  const [pdfProcessing, setPdfProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, accRes, catRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("accounts").select("*").order("name"),
        supabase.from("categories").select("*").order("name"),
      ]);

      if (!userRes.data.user) {
        router.push("/login");
        return;
      }

      setUserId(userRes.data.user.id);
      setAccounts((accRes.data as Account[]) ?? []);
      setCategories((catRes.data as Category[]) ?? []);
    } catch (err) {
      console.error("Erro ao carregar dados de importação:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleParsed(result: OFXParseResult, accountId: string) {
    setParsedTransactions(result.transactions);
    setSelectedAccountId(accountId);
    setParseWarnings(result.errors);
    setCSVContent("");
    setStep("review");
  }

  function handleCSVLoaded(content: string, accountId: string) {
    setCSVContent(content);
    setSelectedAccountId(accountId);
    setStep("csv-mapping");
  }

  function handleCSVMapped(transactions: ParsedTransaction[], warnings: string[]) {
    setParsedTransactions(transactions);
    setParseWarnings(warnings);
    setStep("review");
  }

  async function handlePDFLoaded(file: File, accountId: string) {
    setSelectedAccountId(accountId);
    setPdfProcessing(true);
    setParseWarnings([]);

    try {
      const result = await parsePDFImport(file);

      if (!result.success) {
        setParseWarnings(result.errors);
        setPdfProcessing(false);
        setStep("upload");
        return;
      }

      setParsedTransactions(result.transactions);
      setParseWarnings(result.errors);
      setStep("review");
    } catch {
      setParseWarnings(["Erro ao processar PDF. Tente novamente."]);
      setStep("upload");
    } finally {
      setPdfProcessing(false);
    }
  }

  function handleImported(result: ImportResult) {
    setImportResult(result);
    setStep("summary");
  }

  function handleBack() {
    if (step === "csv-mapping") {
      setCSVContent("");
      setSelectedAccountId("");
      setStep("upload");
    } else if (step === "review") {
      if (csvContent) {
        // CSV flow: go back to mapping
        setParsedTransactions([]);
        setParseWarnings([]);
        setStep("csv-mapping");
      } else {
        // OFX/PDF flow: go back to upload
        setParsedTransactions([]);
        setSelectedAccountId("");
        setParseWarnings([]);
        setStep("upload");
      }
    }
  }

  if (loading) {
    return <TableSkeleton rows={4} cols={3} />;
  }

  // Dynamic step indicators based on flow type
  const isCSVFlow = !!csvContent;
  const steps = isCSVFlow
    ? [
        { key: "upload", label: "Upload" },
        { key: "csv-mapping", label: "Mapeamento" },
        { key: "review", label: "Revis\u00e3o" },
        { key: "summary", label: "Resumo" },
      ]
    : [
        { key: "upload", label: "Upload" },
        { key: "review", label: "Revis\u00e3o" },
        { key: "summary", label: "Resumo" },
      ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div>
      <PageHeader
        title="Importar Transa\u00e7\u00f5es"
        description="Importe transações de extratos bancários (OFX/QFX), planilhas (CSV) ou faturas em PDF."
        action={
          <button
            onClick={() => router.push("/transacoes")}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Voltar para Transa\u00e7\u00f5es
          </button>
        }
      />

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                i <= currentIndex
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`ml-2 text-sm ${
                i <= currentIndex
                  ? "text-slate-900 font-medium"
                  : "text-slate-400"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-3 ${
                  i < currentIndex ? "bg-emerald-600" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Parse warnings */}
      {(step === "review" || (step === "upload" && !pdfProcessing)) && parseWarnings.length > 0 && (
        <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
          <strong>Avisos do parsing:</strong>
          <ul className="list-disc list-inside mt-1">
            {parseWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {step === "upload" && !pdfProcessing && (
        <ImportUpload
          accounts={accounts}
          onParsed={handleParsed}
          onCSVLoaded={handleCSVLoaded}
          onPDFLoaded={handlePDFLoaded}
        />
      )}

      {pdfProcessing && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Extraindo transações com IA...</h3>
              <p className="text-sm text-slate-500 mt-1">
                Analisando o PDF com inteligência artificial. Isso pode levar alguns segundos.
              </p>
            </div>
          </div>
        </div>
      )}

      {step === "csv-mapping" && (
        <ImportCSVMapping
          csvContent={csvContent}
          onMapped={handleCSVMapped}
          onBack={handleBack}
        />
      )}

      {step === "review" && (
        <ImportReviewTable
          transactions={parsedTransactions}
          categories={categories}
          accountId={selectedAccountId}
          userId={userId}
          onImported={handleImported}
          onBack={handleBack}
        />
      )}

      {step === "summary" && importResult && (
        <ImportSummary
          imported={importResult.imported}
          ignored={importResult.ignored}
          duplicates={importResult.duplicates}
        />
      )}
    </div>
  );
}
