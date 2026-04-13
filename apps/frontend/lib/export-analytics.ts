import XLSX from "xlsx-js-style";
import type { Report } from "@mysagra/schemas/src/report.schema";

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

export function exportAnalyticsToExcel(reports: Report[], filename: string = "report_analytics") {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: OrderStats ──
  const headers = ["Data/Ora", "Ricavo Totale", "Ricavo Contanti", "Ricavo Carta", "Ordini Totali", "Tempo Medio Completamento (min)"];

  const dataRows: XLSX.CellObject[][] = reports.map((r) => [
    { v: new Date(r.timestamp).toLocaleString("it-IT"), t: "s" },
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
    { v: "TOTALE", t: "s", s: totalStyle },
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
    { wch: 20 },  // Data/Ora
    { wch: 18 },  // Ricavo Totale
    { wch: 18 },  // Ricavo Contanti
    { wch: 18 },  // Ricavo Carta
    { wch: 14 },  // Ordini Totali
    { wch: 32 },  // Tempo Medio
  ];

  XLSX.utils.book_append_sheet(wb, wsOrders, "OrderStats");

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
    { v: "Nome", t: "s", s: headerStyle },
    { v: "Quantità", t: "s", s: headerStyle },
  ];

  const wsFoods = XLSX.utils.aoa_to_sheet([foodHeaderRow, ...foodDataRows]);
  wsFoods["!cols"] = [{ wch: 30 }, { wch: 12 }];

  XLSX.utils.book_append_sheet(wb, wsFoods, "FoodStats");

  // Generate and download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
