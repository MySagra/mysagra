import { getOrders } from "@/actions/orders";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OrdersContent } from "@/components/dashboard/orders/orders-content";
import { PaginatedOrders } from "@/lib/api-types";

export default async function OrdersPage() {
  let ordersData: PaginatedOrders = {
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
    },
  };

  try {
    ordersData = await getOrders({ page: 1, limit: 20 });
  } catch (error) {
    // fallback to empty
  }

  return (
    <>
      <DashboardHeader title="Ordini" />
      <OrdersContent initialData={ordersData} />
    </>
  );
}
