import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CashRegistersContent } from "@/components/dashboard/cash-registers/cash-registers-content";
import { getCashRegisters } from "@/actions/cash-registers";
import { getPrinters } from "@/actions/printers";
import { CashRegister, Printer } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function CashRegistersPage() {
  let cashRegisters: CashRegister[] = [];
  let printers: Printer[] = [];

  try {
    [cashRegisters, printers] = await Promise.all([
      getCashRegisters("printer"),
      getPrinters(),
    ]);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    cashRegisters = [];
    printers = [];
  }

  return (
    <>
      <DashboardHeader title="Registratori di Cassa" />
      <CashRegistersContent
        initialCashRegisters={cashRegisters}
        printers={printers}
      />
    </>
  );
}
