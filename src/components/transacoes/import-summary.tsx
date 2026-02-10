"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ImportSummaryProps {
  imported: number;
  ignored: number;
  duplicates: number;
}

export function ImportSummary({
  imported,
  ignored,
  duplicates,
}: ImportSummaryProps) {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
          <svg
            className="w-8 h-8 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Importação concluída!
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Confira o resumo abaixo.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{imported}</p>
          <p className="text-sm text-gray-600 mt-1">Importadas</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">{ignored}</p>
          <p className="text-sm text-gray-600 mt-1">Ignoradas</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{duplicates}</p>
          <p className="text-sm text-gray-600 mt-1">Duplicatas</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={() => router.push("/transacoes")}>
          Ir para Transações
        </Button>
      </div>
    </div>
  );
}
