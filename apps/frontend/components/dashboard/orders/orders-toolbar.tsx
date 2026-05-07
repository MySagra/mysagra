"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon, RefreshCw } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";

interface OrdersToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function OrdersToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  isLoading,
}: OrdersToolbarProps) {
  const { t } = useLocale();

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="relative flex-1 max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.orders.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder={t.orders.allStatuses} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.orders.allStatuses}</SelectItem>
          <SelectItem value="PENDING">{t.orders.statusPending}</SelectItem>
          <SelectItem value="CONFIRMED">{t.orders.statusConfirmed}</SelectItem>
          <SelectItem value="COMPLETED">{t.orders.statusCompleted}</SelectItem>
          <SelectItem value="PICKED_UP">{t.orders.statusPickedUp}</SelectItem>
          <SelectItem value="CANCELLED">{t.orders.statusCancelled}</SelectItem>
          <SelectItem value="PARTIAL">{t.orders.statusPartial}</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
        title={t.orders.refreshTitle}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
