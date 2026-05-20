"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CashRegister, OrderListResponse, OrderStatus, PaginatedOrders } from "@/lib/api-types";
import { OrdersToolbar } from "./orders-toolbar";
import { OrdersTable } from "./orders-table";
import { OrderDetailDialog } from "./order-detail-dialog";
import { getOrders } from "@/actions/orders";
import { toast } from "sonner";

interface OrdersContentProps {
  initialData: PaginatedOrders;
  cashRegisters?: CashRegister[];
  dateFrom?: Date;
  dateTo?: Date;
  initialOnlyDiscounted?: boolean;
}

export function OrdersContent({ initialData, cashRegisters = [], dateFrom, dateTo, initialOnlyDiscounted = false }: OrdersContentProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListResponse[]>(
    initialData?.data ?? []
  );
  const [pagination, setPagination] = useState(initialData?.pagination ?? {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [onlyDiscounted, setOnlyDiscounted] = useState(initialOnlyDiscounted);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function loadOrders(params: {
    search?: string;
    status?: string;
    page?: number;
    onlyDiscounted?: boolean;
  }) {
    setIsLoading(true);
    try {
      const statusArr =
        params.status && params.status !== "all"
          ? [params.status as OrderStatus]
          : undefined;

      const data = await getOrders({
        search: params.search || undefined,
        status: statusArr,
        page: params.page || 1,
        limit: 20,
        onlyDiscounted: params.onlyDiscounted || undefined,
      });

      setOrders(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Error loading orders");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(query: string) {
    setSearchQuery(query);
    loadOrders({ search: query, status: statusFilter, onlyDiscounted });
  }

  function handleStatusFilter(status: string) {
    setStatusFilter(status);
    loadOrders({ search: searchQuery, status, onlyDiscounted });
  }

  function handleOnlyDiscountedChange(value: boolean) {
    setOnlyDiscounted(value);
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set("onlyDiscounted", "true");
    } else {
      params.delete("onlyDiscounted");
    }
    const query = params.toString();
    router.replace(query ? `?${query}` : window.location.pathname, { scroll: false });
    loadOrders({ search: searchQuery, status: statusFilter, onlyDiscounted: value });
  }

  function handlePageChange(page: number) {
    loadOrders({ search: searchQuery, status: statusFilter, page, onlyDiscounted });
  }

  function handleViewDetail(order: OrderListResponse) {
    setSelectedOrderId(order.id);
    setDetailOpen(true);
  }

  function handleOrderUpdated() {
    loadOrders({ search: searchQuery, status: statusFilter, page: pagination.currentPage, onlyDiscounted });
  }

  function handleRefresh() {
    loadOrders({ search: searchQuery, status: statusFilter, page: pagination.currentPage, onlyDiscounted });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <OrdersToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilter}
          onlyDiscounted={onlyDiscounted}
          onOnlyDiscountedChange={handleOnlyDiscountedChange}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
        <OrdersTable
          orders={orders}
          pagination={pagination}
          isLoading={isLoading}
          onViewDetail={handleViewDetail}
          onPageChange={handlePageChange}
        />
      </div>
      <OrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        orderId={selectedOrderId}
        cashRegisters={cashRegisters}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
}
