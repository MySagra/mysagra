"use client";

import { useState } from "react";
import { OrderListResponse, OrderStatus, PaginatedOrders } from "@/lib/api-types";
import { OrdersToolbar } from "./orders-toolbar";
import { OrdersTable } from "./orders-table";
import { OrderDetailDialog } from "./order-detail-dialog";
import { getOrders } from "@/actions/orders";
import { toast } from "sonner";

interface OrdersContentProps {
  initialData: PaginatedOrders;
  dateFrom?: Date;
  dateTo?: Date;
}

export function OrdersContent({ initialData, dateFrom, dateTo }: OrdersContentProps) {
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
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function loadOrders(params: {
    search?: string;
    status?: string;
    page?: number;
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
    loadOrders({ search: query, status: statusFilter });
  }

  function handleStatusFilter(status: string) {
    setStatusFilter(status);
    loadOrders({ search: searchQuery, status });
  }

  function handlePageChange(page: number) {
    loadOrders({ search: searchQuery, status: statusFilter, page });
  }

  function handleViewDetail(order: OrderListResponse) {
    setSelectedOrderId(parseInt(order.id));
    setDetailOpen(true);
  }

  function handleOrderUpdated() {
    loadOrders({ search: searchQuery, status: statusFilter, page: pagination.currentPage });
  }

  function handleRefresh() {
    loadOrders({ search: searchQuery, status: statusFilter, page: pagination.currentPage });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <OrdersToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilter}
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
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
}
