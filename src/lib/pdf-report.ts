import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getMonthName } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────

export interface ReportTransaction {
  date: string;
  description: string;
  category: string;
  account: string;
  type: "receita" | "despesa" | "transferencia" | "investimento";
  amount_cents: number;
}

export interface ReportCategoryBreakdown {
  name: string;
  amount_cents: number;
  percent: number;
  categoryGroup?: string | null;
}

export interface ReportKPIs {
  savingsRate: number | null;
  runway: number | null;
  reserveMonths: number | null;
  budgetDeviation: number | null;
  fixedExpensePct: number | null;
}

export interface MonthlyReportData {
  year: number;
  month: number; // 0-based
  closingDay: number;
  totalReceitas: number;
  totalDespesas: number;
  transactions: ReportTransaction[];
  categoryBreakdown: ReportCategoryBreakdown[];
  kpis: ReportKPIs;
  userName?: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function fmtCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],     // blue-800
  success: [22, 163, 74] as [number, number, number],      // green-600
  danger: [220, 38, 38] as [number, number, number],       // red-600
  muted: [100, 116, 139] as [number, number, number],      // slate-500
  heading: [15, 23, 42] as [number, number, number],       // slate-900
  light: [241, 245, 249] as [number, number, number],      // slate-100
  white: [255, 255, 255] as [number, number, number],
};

// ── Main ────────────────────────────────────────────────────────

export function generateMonthlyReport(data: MonthlyReportData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Header ──────────────────────────────────────────────────

  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório Financeiro Mensal", margin, 14);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const monthLabel = `${getMonthName(data.month)} ${data.year}`;
  const periodInfo = data.closingDay > 1
    ? `${monthLabel} (fechamento dia ${data.closingDay})`
    : monthLabel;
  doc.text(periodInfo, margin, 22);

  if (data.userName) {
    doc.setFontSize(9);
    doc.text(data.userName, pageWidth - margin, 22, { align: "right" });
  }

  doc.setFontSize(8);
  const now = new Date();
  doc.text(
    `Gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    pageWidth - margin, 28, { align: "right" }
  );

  y = 40;

  // ── Summary Cards ───────────────────────────────────────────

  doc.setTextColor(...COLORS.heading);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo do Período", margin, y);
  y += 7;

  const saldo = data.totalReceitas - data.totalDespesas;
  const cardW = contentWidth / 3 - 2;

  // Receitas card
  drawCard(doc, margin, y, cardW, "Receitas", fmtCurrency(data.totalReceitas), COLORS.success);
  // Despesas card
  drawCard(doc, margin + cardW + 3, y, cardW, "Despesas", fmtCurrency(data.totalDespesas), COLORS.danger);
  // Saldo card
  drawCard(doc, margin + (cardW + 3) * 2, y, cardW, "Saldo", fmtCurrency(saldo), saldo >= 0 ? COLORS.primary : COLORS.danger);

  y += 24;

  // ── KPIs ────────────────────────────────────────────────────

  doc.setTextColor(...COLORS.heading);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Indicadores", margin, y);
  y += 5;

  const kpiRows: string[][] = [];
  const { kpis } = data;

  if (kpis.savingsRate !== null) {
    kpiRows.push(["Taxa de Poupança", `${kpis.savingsRate.toFixed(1)}%`]);
  }
  if (kpis.runway !== null) {
    kpiRows.push(["Runway Financeiro", `${kpis.runway.toFixed(1)} meses`]);
  }
  if (kpis.reserveMonths !== null) {
    kpiRows.push(["Reserva de Emergência", `${kpis.reserveMonths.toFixed(1)} meses`]);
  }
  if (kpis.budgetDeviation !== null) {
    kpiRows.push(["Desvio Orçamentário", `${kpis.budgetDeviation.toFixed(1)}%`]);
  }
  if (kpis.fixedExpensePct !== null) {
    kpiRows.push(["% Gasto Fixo", `${kpis.fixedExpensePct.toFixed(1)}%`]);
  }

  if (kpiRows.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Indicador", "Valor"]],
      body: kpiRows,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: COLORS.light,
        textColor: COLORS.heading,
        fontStyle: "bold",
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.6 },
        1: { cellWidth: contentWidth * 0.4, halign: "right" },
      },
    });
    y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
    y += 6;
  }

  // ── Category Breakdown ──────────────────────────────────────

  if (data.categoryBreakdown.length > 0) {
    checkPageBreak(doc, y, 40);
    y = getCurrentY(doc, y);

    doc.setTextColor(...COLORS.heading);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Despesas por Categoria", margin, y);
    y += 5;

    const catRows = data.categoryBreakdown.map((c) => [
      c.name,
      fmtCurrency(c.amount_cents),
      `${c.percent.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Categoria", "Valor (R$)", "%"]],
      body: catRows,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.5 },
        1: { cellWidth: contentWidth * 0.3, halign: "right" },
        2: { cellWidth: contentWidth * 0.2, halign: "right" },
      },
    });
    y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
    y += 8;
  }

  // ── Transactions Table ──────────────────────────────────────

  if (data.transactions.length > 0) {
    checkPageBreak(doc, y, 30);
    y = getCurrentY(doc, y);

    doc.setTextColor(...COLORS.heading);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Transações (${data.transactions.length})`, margin, y);
    y += 5;

    const txnRows = data.transactions.map((t) => {
      const sign = t.type === "receita" ? "+" : t.type === "transferencia" ? "" : "-";
      return [
        fmtDate(t.date),
        t.description,
        t.type === "transferencia" ? "Transf." : t.category,
        t.account,
        `${sign} ${fmtCurrency(t.amount_cents)}`,
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Data", "Descrição", "Categoria", "Conta", "Valor (R$)"]],
      body: txnRows,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2, overflow: "ellipsize" },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: contentWidth - 22 - 30 - 28 - 28 },
        2: { cellWidth: 30 },
        3: { cellWidth: 28 },
        4: { cellWidth: 28, halign: "right" },
      },
      didParseCell(hookData) {
        if (hookData.section === "body" && hookData.column.index === 4) {
          const text = String(hookData.cell.raw);
          if (text.startsWith("+")) {
            hookData.cell.styles.textColor = COLORS.success;
          } else if (text.startsWith("-")) {
            hookData.cell.styles.textColor = COLORS.danger;
          }
        }
      },
    });
  }

  // ── Footer ──────────────────────────────────────────────────

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `FinApp — Relatório Financeiro | Página ${i} de ${pageCount}`,
      pageWidth / 2, pageH - 8, { align: "center" }
    );
  }

  // ── Save ────────────────────────────────────────────────────

  const filename = `relatorio-${data.year}-${String(data.month + 1).padStart(2, "0")}.pdf`;
  doc.save(filename);
}

// ── Drawing helpers ─────────────────────────────────────────────

function drawCard(
  doc: jsPDF,
  x: number, y: number, w: number,
  label: string, value: string,
  color: [number, number, number]
): void {
  // Background
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(x, y, w, 18, 2, 2, "F");

  // Accent bar
  doc.setFillColor(...color);
  doc.rect(x, y, 3, 18, "F");

  // Label
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text(label, x + 7, y + 6);

  // Value
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color);
  doc.text(`R$ ${value}`, x + 7, y + 14);
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): void {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 15) {
    doc.addPage();
  }
}

function getCurrentY(doc: jsPDF, fallback: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (fallback > pageH - 15) return 15;
  return fallback;
}
