"use client";

import { useEffect, useRef, useState } from "react";
import { OrderListResponse, PaginatedOrders } from "@/lib/api-types";
import { OrdersToolbar } from "./orders-toolbar";
import { OrdersTable } from "./orders-table";
import { OrderDetailDialog } from "./order-detail-dialog";
import { OrdersAdvancedSearchDialog } from "./orders-advanced-search-dialog";
import {
  EMPTY_ADVANCED_FILTERS,
  countActiveFilters,
  loadStoredFilters,
  pageStateToQuery,
  pageStateToSearchParams,
  storeFilters,
  type AdvancedOrderFilters,
  type OrdersPageState,
} from "./advanced-filters";
import { getOrders } from "@/actions/orders";
import { toast } from "sonner";

const MIN_LOADING_MS = 250;

interface OrdersContentProps {
  initialData: PaginatedOrders;
  /** Page state parsed from the URL by the server page (same filters as initialData) */
  initialState: OrdersPageState;
}

export function OrdersContent({ initialData, initialState }: OrdersContentProps) {
  const [orders, setOrders] = useState<OrderListResponse[]>(
    initialData?.data ?? []
  );
  const [pagination, setPagination] = useState(initialData?.pagination ?? {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
  });
  // Search, advanced filters and page currently applied (mirrored in the URL)
  const [pageState, setPageState] = useState<OrdersPageState>(initialState);
  // Last filters submitted in the dialog: prefill it on reopen, even after clearing
  const [dialogFilters, setDialogFilters] = useState<AdvancedOrderFilters>(
    initialState.advanced ?? EMPTY_ADVANCED_FILTERS
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const latestRequest = useRef(0);

  // No filters in the URL: prefill the dialog with the last submitted ones
  useEffect(() => {
    if (initialState.advanced) return;
    const stored = loadStoredFilters();
    if (stored) setDialogFilters(stored);
  }, [initialState.advanced]);

  async function loadOrders(state: OrdersPageState) {
    const requestId = ++latestRequest.current;
    setIsLoading(true);
    try {
      // Minimum wait so the loading state never flickers on fast responses
      const [data] = await Promise.all([
        getOrders({ ...pageStateToQuery(state), page: state.page, limit: 20 }),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);
      // A newer search started meanwhile: drop this stale response
      if (requestId !== latestRequest.current) return;
      setOrders(data.data);
      setPagination(data.pagination);
    } catch {
      if (requestId === latestRequest.current) toast.error("Error loading orders");
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }

  // Applies a new state: URL first (so F5 repeats the same GET), then fetch
  function applyState(state: OrdersPageState) {
    setPageState(state);
    const query = pageStateToSearchParams(state).toString();
    // History API keeps Next's router in sync without a server round-trip
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    loadOrders(state);
  }

  // Standard search: only the `search` param, advanced filters are not applied
  function handleSearch(search: string) {
    applyState({ search, advanced: null, page: 1 });
  }

  function handleApplyAdvanced(filters: AdvancedOrderFilters) {
    setDialogFilters(filters);
    storeFilters(filters);
    applyState({ search: "", advanced: countActiveFilters(filters) > 0 ? filters : null, page: 1 });
  }

  function handleClearAdvanced() {
    applyState({ search: "", advanced: null, page: 1 });
  }

  function handlePageChange(page: number) {
    applyState({ ...pageState, page });
  }

  function handleViewDetail(order: OrderListResponse) {
    setSelectedOrderId(order.id);
    setDetailOpen(true);
  }

  function handleRefresh() {
    loadOrders({ ...pageState, page: pagination.currentPage });
  }

  const advancedActive = pageState.advanced !== null;
  const shownFilters = pageState.advanced ?? dialogFilters;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <OrdersToolbar
          searchQuery={pageState.search}
          onSearchChange={handleSearch}
          onOpenAdvanced={() => setAdvancedOpen(true)}
          advancedActive={advancedActive}
          advancedFilters={shownFilters}
          advancedCount={countActiveFilters(shownFilters)}
          onClearAdvanced={handleClearAdvanced}
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
        onOrderUpdated={handleRefresh}
      />
      <OrdersAdvancedSearchDialog
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        filters={shownFilters}
        onApply={handleApplyAdvanced}
      />
    </div>
  );
}
