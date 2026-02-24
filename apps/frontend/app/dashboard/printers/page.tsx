import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PrintersContent } from "@/components/dashboard/printers/printers-content";
import { getPrinters } from "@/actions/printers";
import { Printer } from "@/lib/api-types";

export default async function PrintersPage() {
  let printers: Printer[] = [];
  try {
    printers = await getPrinters();
  } catch (error) {
    printers = [];
  }

  return (
    <>
      <DashboardHeader title="Stampanti" />
      <PrintersContent initialPrinters={printers} />
    </>
  );
}
