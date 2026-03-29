"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useInvestmentData } from "@/hooks/use-investment-data";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { FinancialKPIs } from "@/components/dashboard/financial-kpis";
import { FinancialInsights } from "@/components/dashboard/financial-insights";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { BudgetComparison } from "@/components/dashboard/budget-comparison";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SectionErrorBoundary } from "@/components/dashboard/section-error-boundary";
import { Modal } from "@/components/ui/modal";
import { CardsSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { usePreferences } from "@/contexts/preferences-context";
import { useToast } from "@/contexts/toast-context";

// Lazy-load heavy / below-the-fold components
const CategoryChart = dynamic(
  () => import("@/components/dashboard/category-chart").then((mod) => mod.CategoryChart),
  { ssr: false, loading: () => <div className="h-48 animate-pulse bg-tab-bg rounded-lg" /> }
);
const InvestmentSummary = dynamic(
  () => import("@/components/dashboard/investment-summary").then((mod) => mod.InvestmentSummary),
  { ssr: false, loading: () => <div className="h-32 animate-pulse bg-tab-bg rounded-xl" /> }
);
const MonthlyClosing = dynamic(
  () => import("@/components/dashboard/monthly-closing").then((mod) => mod.MonthlyClosing),
  { ssr: false }
);
const RecurrenceSuggestions = dynamic(
  () => import("@/components/dashboard/recurrence-suggestions").then((mod) => mod.RecurrenceSuggestions),
  { ssr: false, loading: () => <div className="h-24 animate-pulse bg-tab-bg rounded-xl" /> }
);
const GoalsSummary = dynamic(
  () => import("@/components/dashboard/goals-summary").then((mod) => mod.GoalsSummary),
  { ssr: false, loading: () => <div className="h-24 animate-pulse bg-tab-bg rounded-xl" /> }
);
const DebtSummary = dynamic(
  () => import("@/components/dashboard/debt-summary").then((mod) => mod.DebtSummary),
  { ssr: false, loading: () => <div className="h-24 animate-pulse bg-tab-bg rounded-xl" /> }
);

export default function DashboardPage() {
  const [showClosing, setShowClosing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const data = useDashboardData();
  const { investmentData, ipca12m } = useInvestmentData();
  const { fullName } = usePreferences();
  const { addToast } = useToast();

  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const { generateMonthlyReport } = await import("@/lib/pdf-report");
      const totalDespesas = data.totalDespesas;
      generateMonthlyReport({
        year: data.year,
        month: data.month,
        closingDay: data.closingDay,
        totalReceitas: data.totalReceitas,
        totalDespesas,
        transactions: data.transactions.map((t) => ({
          date: t.date,
          description: t.description,
          category: t.categories?.name ?? "Sem categoria",
          account: t.accounts?.name ?? "-",
          type: t.type,
          amount_cents: t.amount_cents,
        })),
        categoryBreakdown: data.chartData.map((c) => ({
          name: c.name,
          amount_cents: c.amount,
          percent: totalDespesas > 0 ? (c.amount / totalDespesas) * 100 : 0,
        })),
        kpis: {
          savingsRate: data.savingsRate,
          runway: data.runway,
          reserveMonths: data.reserveMonths,
          budgetDeviation: data.budgetDeviation,
          fixedExpensePct: data.fixedExpensePct,
        },
        userName: fullName || undefined,
      });
      addToast("Relatório PDF gerado com sucesso.", "success");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      addToast("Erro ao gerar relatório PDF.", "error");
    } finally {
      setExporting(false);
    }
  }, [data, fullName, addToast]);

  return (
    <div>
      <DashboardHeader
        showClosingButton={!!data.currentMonthForecast}
        onOpenClosing={() => setShowClosing(true)}
        onExportPdf={data.loading ? undefined : handleExportPdf}
        exporting={exporting}
      />

      <div className="mb-6">
        <MonthPicker
          year={data.year}
          month={data.month}
          onPrev={data.prevMonth}
          onNext={data.nextMonth}
          closingDay={data.closingDay}
        />
      </div>

      {data.loading || data.prefsLoading ? (
        <div className="space-y-10">
          <CardsSkeleton />
          <TableSkeleton rows={6} cols={5} />
        </div>
      ) : (
        <>
          <SummaryCards totalReceitas={data.totalReceitas} totalDespesas={data.totalDespesas} />

          <SectionErrorBoundary sectionName="KPIs">
            <div className="mt-4">
              <FinancialKPIs
                totalReceitas={data.totalReceitas}
                totalDespesas={data.totalDespesas}
                totalBalance={data.totalAccountBalance}
                avgMonthlyExpense={data.avgMonthlyExpense}
                avgEssentialExpense={data.avgEssentialExpense}
                hasEssentialCategories={data.hasEssentialCategories}
                reserveBalance={data.reserveBalance}
                hasReserveAccount={data.hasReserveAccount}
                reserveTargetMonths={data.reserveTargetMonths}
                forecastDespesas={data.forecastDespesas}
                totalRecurringDespesas={data.totalRecurringDespesas}
              />
            </div>
          </SectionErrorBoundary>

          <SectionErrorBoundary sectionName="Insights">
            <div className="mt-4">
              <FinancialInsights
                totalReceitas={data.totalReceitas}
                totalDespesas={data.totalDespesas}
                savingsRate={data.savingsRate}
                runway={data.runway}
                reserveMonths={data.reserveMonths}
                forecast={data.currentMonthForecast}
                hasInvestments={investmentData.hasData}
                reserveTargetMonths={data.reserveTargetMonths}
                goals={data.dashGoals}
                accounts={data.dashAccounts}
                pastSavingsRates={data.pastSavingsRates}
                annualProvisions={data.annualProvisions}
                hasDivergentAccounts={data.hasDivergentAccounts}
                debts={data.dashDebts}
              />
            </div>
          </SectionErrorBoundary>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Left column */}
            <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-4 sm:gap-6">
              {data.currentMonthForecast && (
                <SectionErrorBoundary sectionName="Previsto vs Realizado">
                  <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex-1">
                    <h2 className="text-lg font-semibold text-on-surface-heading mb-4">
                      Previsto vs Realizado
                    </h2>
                    <BudgetComparison month={data.currentMonthForecast} closingDay={data.closingDay} />
                  </div>
                </SectionErrorBoundary>
              )}

              <SectionErrorBoundary sectionName="Investimentos">
                <InvestmentSummary
                  totalBalance={investmentData.totalBalance}
                  lastReturn={investmentData.lastReturn}
                  lastReturnPercent={investmentData.lastReturnPercent}
                  hasData={investmentData.hasData}
                  ipca12m={ipca12m}
                />
              </SectionErrorBoundary>

              {data.recurrenceSuggestions.length > 0 && (
                <SectionErrorBoundary sectionName="Recorrências sugeridas">
                  <RecurrenceSuggestions suggestions={data.recurrenceSuggestions} />
                </SectionErrorBoundary>
              )}

              {data.dashGoals.length > 0 && (
                <SectionErrorBoundary sectionName="Metas">
                  <GoalsSummary goals={data.dashGoals} accounts={data.dashAccounts} />
                </SectionErrorBoundary>
              )}

              {data.dashDebts.length > 0 && (
                <SectionErrorBoundary sectionName="Dívidas">
                  <DebtSummary debts={data.dashDebts} />
                </SectionErrorBoundary>
              )}
            </div>

            {/* Right column */}
            <div className="md:col-span-1 lg:col-span-2 flex">
              <div className="bg-card rounded-xl border border-border shadow-sm flex-1 flex flex-col">
                <SectionErrorBoundary sectionName="Despesas por categoria">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-on-surface-heading mb-4">
                      Despesas por Categoria
                    </h2>
                    <CategoryChart data={data.chartData} />
                  </div>
                </SectionErrorBoundary>

                <div className="border-t border-border" />

                <RecentTransactions transactions={data.recentTransactions} />
              </div>
            </div>
          </div>
        </>
      )}

      {data.currentMonthForecast && (
        <Modal
          open={showClosing}
          onClose={() => setShowClosing(false)}
          title="Fechamento do Mês"
        >
          <MonthlyClosing
            forecast={data.currentMonthForecast}
            totalReceitas={data.totalReceitas}
            totalDespesas={data.totalDespesas}
            savingsRate={data.savingsRate}
            month={data.closingMonthStr}
            runwayMonths={data.runway}
            reserveMonths={data.reserveMonths}
            budgetDeviation={data.budgetDeviation}
            fixedExpensePct={data.fixedExpensePct}
            totalBalance={data.totalAccountBalance}
            existingClosing={data.existingClosing}
            previousClosing={data.previousClosing}
            onSaved={() => {
              setShowClosing(false);
              data.fetchData();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
