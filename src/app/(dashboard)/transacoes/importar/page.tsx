"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ImportUpload } from "@/components/transacoes/import-upload";
import { ImportReviewTable } from "@/components/transacoes/import-review-table";
import { ImportSummary } from "@/components/transacoes/import-summary";
import type { OFXParseResult, ParsedTransaction } from "@/lib/ofx-parser";
import type { Account, Category } from "@/types/database";

type Step = "upload" | "review" | "summary";

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

  const fetchData = useCallback(async () => {
    setLoading(true);

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
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleParsed(result: OFXParseResult, accountId: string) {
    setParsedTransactions(result.transactions);
    setSelectedAccountId(accountId);
    setParseWarnings(result.errors);
    setStep("review");
  }

  function handleImported(result: ImportResult) {
    setImportResult(result);
    setStep("summary");
  }

  function handleBack() {
    setParsedTransactions([]);
    setSelectedAccountId("");
    setParseWarnings([]);
    setStep("upload");
  }

  if (loading) {
    return <TableSkeleton rows={4} cols={3} />;
  }

  // Step indicators
  const steps = [
    { key: "upload", label: "Upload" },
    { key: "review", label: "Revisão" },
    { key: "summary", label: "Resumo" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div>
      <PageHeader
        title="Importar OFX"
        description="Importe transações do extrato bancário ou cartão de crédito."
        action={
          <button
            onClick={() => router.push("/transacoes")}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Voltar para Transações
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
      {step === "review" && parseWarnings.length > 0 && (
        <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
          <strong>Avisos do parsing:</strong>
          <ul className="list-disc list-inside mt-1">
            {parseWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {step === "upload" && (
        <ImportUpload accounts={accounts} onParsed={handleParsed} />
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
