import { getOrders } from "@/actions/orders";
import { getCashRegisters } from "@/actions/cash-registers";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OrdersContent } from "@/components/dashboard/orders/orders-content";
import { PaginatedOrders, CashRegister } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function OrdersPage() {
  let ordersData: PaginatedOrders = {
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
    },
  };
  let cashRegisters: CashRegister[] = [];

  try {
    [ordersData, cashRegisters] = await Promise.all([
      getOrders({ page: 1, limit: 20 }),
      getCashRegisters(),
    ]);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    // fallback to empty
  }

  return (
    <>
      <DashboardHeader title="Ordini" />
      <OrdersContent initialData={ordersData} cashRegisters={cashRegisters} />
    </>
  );
}
