import XLSX from "xlsx-js-style";
import type { Report } from "@mysagra/schemas/src/report.schema";
import type { Translations } from "@/lib/i18n";

function num(v: unknown): number {
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (typeof v === "string") { const n = Number(v); return isNaN(n) ? 0 : n; }
  return 0;
}

function fmtEur(v: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(v);
}

const headerStyle: XLSX.CellStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "2D7D46" } },
  alignment: { horizontal: "center" },
};

const totalStyle: XLSX.CellStyle = {
  font: { bold: true },
  fill: { fgColor: { rgb: "FFFF00" } },
};

const cashRegisterHeaderStyle: XLSX.CellStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "1A6FB5" } },
  alignment: { horizontal: "center" },
};

export function exportAnalyticsToExcel(
  reports: Report[],
  t: Translations,
  locale: string,
  filename: string = "report_analytics"
) {
  const wb = XLSX.utils.book_new();
  const dateLocale = locale === "it" ? "it-IT" : "en-GB";

  // ── Sheet 1: OrderStats ──
  const headers = [
    t.analytics.excelColDateTime,
    t.analytics.excelColTotalRevenue,
    t.analytics.excelColCashRevenue,
    t.analytics.excelColCardRevenue,
    t.analytics.excelColTotalOrders,
    t.analytics.excelColAvgCompletion,
  ];

  const dataRows: XLSX.CellObject[][] = reports.map((r) => [
    { v: new Date(r.timestamp).toLocaleString(dateLocale), t: "s" },
    { v: fmtEur(num(r.totalRevenue)), t: "s" },
    { v: fmtEur(num(r.totalCashRevenue)), t: "s" },
    { v: fmtEur(num(r.totalCardRevenue)), t: "s" },
    { v: r.totalOrders, t: "n" },
    { v: r.averageCompletitionTime != null ? Math.round(num(r.averageCompletitionTime) / 60000 * 10) / 10 : "", t: r.averageCompletitionTime != null ? "n" : "s" },
  ]);

  // Totals
  const totalRevenue = reports.reduce((s, r) => s + num(r.totalRevenue), 0);
  const totalCash = reports.reduce((s, r) => s + num(r.totalCashRevenue), 0);
  const totalCard = reports.reduce((s, r) => s + num(r.totalCardRevenue), 0);
  const totalOrders = reports.reduce((s, r) => s + r.totalOrders, 0);
  const avgTimes = reports
    .filter((r) => r.averageCompletitionTime != null)
    .map((r) => num(r.averageCompletitionTime));
  const avgTime = avgTimes.length > 0
    ? Math.round((avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length) / 60000 * 10) / 10
    : "";

  const totalRow: XLSX.CellObject[] = [
    { v: t.analytics.excelTotal, t: "s", s: totalStyle },
    { v: fmtEur(totalRevenue), t: "s", s: totalStyle },
    { v: fmtEur(totalCash), t: "s", s: totalStyle },
    { v: fmtEur(totalCard), t: "s", s: totalStyle },
    { v: totalOrders, t: "n", s: totalStyle },
    { v: avgTime, t: typeof avgTime === "number" ? "n" : "s", s: totalStyle },
  ];

  // Build header row with styles
  const headerRow: XLSX.CellObject[] = headers.map((h) => ({
    v: h,
    t: "s" as const,
    s: headerStyle,
  }));

  const wsOrders = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows, totalRow]);

  // Column widths
  wsOrders["!cols"] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 32 },
  ];

  XLSX.utils.book_append_sheet(wb, wsOrders, t.analytics.excelSheetOrders);

  // ── Sheet 2: FoodStats ──
  const foodMap = new Map<string, { name: string; quantity: number }>();

  for (const report of reports) {
    for (const cat of report.categoryStats) {
      for (const food of cat.foodStats) {
        const existing = foodMap.get(food.foodId);
        if (existing) {
          existing.quantity += num(food.quantity);
        } else {
          foodMap.set(food.foodId, {
            name: food.foodName,
            quantity: num(food.quantity),
          });
        }
      }
    }
  }

  const foodDataRows: XLSX.CellObject[][] = Array.from(foodMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .map((f) => [
      { v: f.name, t: "s" },
      { v: f.quantity, t: "n" },
    ]);

  const foodHeaderRow: XLSX.CellObject[] = [
    { v: t.analytics.excelColName, t: "s", s: headerStyle },
    { v: t.analytics.excelColQuantity, t: "s", s: headerStyle },
  ];

  const wsFoods = XLSX.utils.aoa_to_sheet([foodHeaderRow, ...foodDataRows]);
  wsFoods["!cols"] = [{ wch: 30 }, { wch: 12 }];

  XLSX.utils.book_append_sheet(wb, wsFoods, t.analytics.excelSheetFoods);

  // ── Sheet 3: CashRegisterStats ──
  const crMap = new Map<string, { name: string; totalRevenue: number; totalCashRevenue: number; totalCardRevenue: number }>();

  for (const report of reports) {
    if (report.cashRegisterStats) {
      for (const cr of report.cashRegisterStats) {
        const existing = crMap.get(cr.cashRegisterId);
        if (existing) {
          existing.totalRevenue += num(cr.totalRevenue);
          existing.totalCashRevenue += num(cr.totalCashRevenue);
          existing.totalCardRevenue += num(cr.totalCardRevenue);
        } else {
          crMap.set(cr.cashRegisterId, {
            name: cr.cashRegisterName,
            totalRevenue: num(cr.totalRevenue),
            totalCashRevenue: num(cr.totalCashRevenue),
            totalCardRevenue: num(cr.totalCardRevenue),
          });
        }
      }
    }
  }

  const crDataRows: XLSX.CellObject[][] = Array.from(crMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((cr) => [
      { v: cr.name, t: "s" },
      { v: fmtEur(cr.totalRevenue), t: "s" },
      { v: fmtEur(cr.totalCashRevenue), t: "s" },
      { v: fmtEur(cr.totalCardRevenue), t: "s" },
    ]);

  // Totals for cash registers
  const crTotalRevenue = Array.from(crMap.values()).reduce((s, cr) => s + cr.totalRevenue, 0);
  const crTotalCash = Array.from(crMap.values()).reduce((s, cr) => s + cr.totalCashRevenue, 0);
  const crTotalCard = Array.from(crMap.values()).reduce((s, cr) => s + cr.totalCardRevenue, 0);

  const crTotalRow: XLSX.CellObject[] = [
    { v: t.analytics.excelTotal, t: "s", s: totalStyle },
    { v: fmtEur(crTotalRevenue), t: "s", s: totalStyle },
    { v: fmtEur(crTotalCash), t: "s", s: totalStyle },
    { v: fmtEur(crTotalCard), t: "s", s: totalStyle },
  ];

  const crHeaderRow: XLSX.CellObject[] = [
    { v: t.analytics.excelColCashRegister, t: "s", s: cashRegisterHeaderStyle },
    { v: t.analytics.excelColTotalRevenue, t: "s", s: cashRegisterHeaderStyle },
    { v: t.analytics.excelColCashRevenue, t: "s", s: cashRegisterHeaderStyle },
    { v: t.analytics.excelColCardRevenue, t: "s", s: cashRegisterHeaderStyle },
  ];

  const wsCashRegisters = XLSX.utils.aoa_to_sheet([crHeaderRow, ...crDataRows, crTotalRow]);
  wsCashRegisters["!cols"] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, wsCashRegisters, t.analytics.excelSheetCashRegisters);

  // Generate and download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
