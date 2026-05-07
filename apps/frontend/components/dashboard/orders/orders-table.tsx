"use client";

import { useState, useMemo, useEffect } from "react";
import { OrderListResponse } from "@/lib/api-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, ChevronLeftIcon, ChevronRightIcon, ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon, Clock, CircleCheck, PackageCheck, ShoppingBag, XIcon, GitMerge } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";
import { useTimezone } from "@/contexts/timezone-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OrdersTableProps {
  orders: OrderListResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  isLoading: boolean;
  onViewDetail: (order: OrderListResponse) => void;
  onPageChange: (page: number) => void;
}

type SortColumn = "displayCode" | "customer" | "table" | "subTotal" | "status" | "createdAt" | null;
type SortDirection = "asc" | "desc";

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4 text-muted-foreground" />,
  CONFIRMED: <CircleCheck className="h-4 w-4 text-primary" />,
  COMPLETED: <PackageCheck className="h-4 w-4 text-green-500" />,
  PICKED_UP: <ShoppingBag className="h-4 w-4 text-green-600" />,
  CANCELLED: <XIcon className="h-4 w-4 text-destructive" />,
  PARTIAL: <GitMerge className="h-4 w-4 text-orange-500" />,
};

export function OrdersTable({
  orders,
  pagination,
  isLoading,
  onViewDetail,
  onPageChange,
}: OrdersTableProps) {
  const { t } = useLocale();
  const timezone = useTimezone();
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const statusLabels: Record<string, string> = {
    PENDING: t.orders.statusPending,
    CONFIRMED: t.orders.statusConfirmed,
    COMPLETED: t.orders.statusCompleted,
    PICKED_UP: t.orders.statusPickedUp,
    CANCELLED: t.orders.statusCancelled,
    PARTIAL: t.orders.statusPartial,
  };

  useEffect(() => {
    const savedColumn = localStorage.getItem("orders-table-sort-column");
    const savedDirection = localStorage.getItem("orders-table-sort-direction");
    if (savedColumn) {
      setSortColumn(savedColumn as SortColumn);
    }
    if (savedDirection) {
      setSortDirection(savedDirection as SortDirection);
    }
  }, []);

  useEffect(() => {
    if (sortColumn) {
      localStorage.setItem("orders-table-sort-column", sortColumn);
    } else {
      localStorage.removeItem("orders-table-sort-column");
    }
    localStorage.setItem("orders-table-sort-direction", sortDirection);
  }, [sortColumn, sortDirection]);

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const sortedOrders = useMemo(() => {
    if (!sortColumn || !orders) return orders;

    return [...orders].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "displayCode":
          aValue = a.displayCode;
          bValue = b.displayCode;
          break;
        case "customer":
          aValue = a.customer.toLowerCase();
          bValue = b.customer.toLowerCase();
          break;
        case "table":
          aValue = a.table;
          bValue = b.table;
          break;
        case "subTotal":
          aValue = a.subTotal;
          bValue = b.subTotal;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [orders, sortColumn, sortDirection]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString("it-IT", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDateShort(dateStr: string): string {
    return new Date(dateStr).toLocaleString("it-IT", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) {
      return <ArrowUpDownIcon className="h-4 w-4 ml-1 opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  }

  if (!sortedOrders || (sortedOrders.length === 0 && !isLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">
          {t.orders.noOrdersFound}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center mx-auto hover:text-foreground transition-colors font-medium"
                >
                  <SortIcon column="status" />
                </button>
              </TableHead>
              <TableHead className="w-20">
                <button
                  onClick={() => handleSort("displayCode")}
                  className="flex items-center hover:text-foreground transition-colors font-medium"
                >
                  {t.orders.columnCode}
                  <SortIcon column="displayCode" />
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <button
                  onClick={() => handleSort("customer")}
                  className="flex items-center hover:text-foreground transition-colors font-medium"
                >
                  {t.orders.columnCustomer}
                  <SortIcon column="customer" />
                </button>
              </TableHead>
              <TableHead className="w-20 hidden sm:table-cell">
                <button
                  onClick={() => handleSort("table")}
                  className="flex items-center mx-auto hover:text-foreground transition-colors font-medium"
                >
                  {t.orders.columnTable}
                  <SortIcon column="table" />
                </button>
              </TableHead>
              <TableHead className="w-24 sm:w-28">
                <button
                  onClick={() => handleSort("subTotal")}
                  className="flex items-center ml-auto hover:text-foreground transition-colors font-medium"
                >
                  {t.orders.columnTotal}
                  <SortIcon column="subTotal" />
                </button>
              </TableHead>
              <TableHead className="w-16 sm:w-40">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center hover:text-foreground transition-colors font-medium"
                >
                  {t.orders.columnDate}
                  <SortIcon column="createdAt" />
                </button>
              </TableHead>
              <TableHead className="w-16 text-right">{t.orders.columnDetails}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">{t.common.loading}</p>
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-center">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex justify-center cursor-default">
                            {statusIcons[order.status]}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {statusLabels[order.status] || order.status}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {order.displayCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium max-w-48 hidden sm:table-cell">
                    <span className="block truncate" title={order.customer}>{order.customer}</span>
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">{order.table === 'NO_TABLE_PRESET' ? '--' : order.table}</TableCell>
                  <TableCell className="text-right font-medium">
                    €{order.subTotal}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <span className="hidden sm:inline">{formatDate(order.createdAt)}</span>
                    <span className="sm:hidden">{formatDateShort(order.createdAt)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetail(order)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>


      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t.orders.paginationPage} {pagination.currentPage} {t.orders.paginationOf} {pagination.totalPages} (
            {pagination.totalItems} {t.orders.paginationOrders})
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1 || isLoading}
              onClick={() => onPageChange(pagination.currentPage - 1)}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              {t.orders.previousPage}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages || isLoading}
              onClick={() => onPageChange(pagination.currentPage + 1)}
            >
              {t.orders.nextPage}
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
