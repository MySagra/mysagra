"use client";

import { useState, useMemo, useEffect } from "react";
import { Printer } from "@/lib/api-types";
import { updatePrinterStatus } from "@/actions/printers";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PencilIcon, ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from "lucide-react";
import { toast } from "sonner";

interface PrintersTableProps {
  printers: Printer[];
  onEdit: (printer: Printer) => void;
  onStatusUpdate: (updated: Printer) => void;
}

type SortColumn = "name" | "ip" | "port" | "description" | "status" | null;
type SortDirection = "asc" | "desc";

const statusLabels: Record<string, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  ERROR: "Error",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ONLINE: "default",
  OFFLINE: "secondary",
  ERROR: "destructive",
};

export function PrintersTable({
  printers,
  onEdit,
  onStatusUpdate,
}: PrintersTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    const savedColumn = localStorage.getItem("printers-table-sort-column");
    const savedDirection = localStorage.getItem("printers-table-sort-direction");
    if (savedColumn) {
      setSortColumn(savedColumn as SortColumn);
    }
    if (savedDirection) {
      setSortDirection(savedDirection as SortDirection);
    }
  }, []);

  useEffect(() => {
    if (sortColumn) {
      localStorage.setItem("printers-table-sort-column", sortColumn);
    } else {
      localStorage.removeItem("printers-table-sort-column");
    }
    localStorage.setItem("printers-table-sort-direction", sortDirection);
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

  const sortedPrinters = useMemo(() => {
    if (!sortColumn) return printers;

    return [...printers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "ip":
          aValue = a.ip;
          bValue = b.ip;
          break;
        case "port":
          aValue = a.port;
          bValue = b.port;
          break;
        case "description":
          aValue = (a.description || "").toLowerCase();
          bValue = (b.description || "").toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [printers, sortColumn, sortDirection]);

  async function handleStatusChange(
    printer: Printer,
    newStatus: "ONLINE" | "OFFLINE" | "ERROR"
  ) {
    setUpdatingId(printer.id);
    try {
      const updated = await updatePrinterStatus(printer.id, newStatus);
      onStatusUpdate(updated);
      toast.success(`Status of "${printer.name}" updated`);
    } catch (error) {
      toast.error("Error updating status");
    } finally {
      setUpdatingId(null);
    }
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

  if (sortedPrinters.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">
          No printers found
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12"></TableHead>
            <TableHead>
              <button
                onClick={() => handleSort("name")}
                className="flex items-center hover:text-foreground transition-colors font-medium"
              >
                Name
                <SortIcon column="name" />
              </button>
            </TableHead>
            <TableHead className="w-40 hidden md:table-cell">
              <button
                onClick={() => handleSort("ip")}
                className="flex items-center hover:text-foreground transition-colors font-medium"
              >
                IP
                <SortIcon column="ip" />
              </button>
            </TableHead>
            <TableHead className="w-20 hidden md:table-cell">
              <button
                onClick={() => handleSort("port")}
                className="flex items-center mx-auto hover:text-foreground transition-colors font-medium"
              >
                Port
                <SortIcon column="port" />
              </button>
            </TableHead>
            <TableHead className="w-48 hidden md:table-cell">
              <button
                onClick={() => handleSort("description")}
                className="flex items-center hover:text-foreground transition-colors font-medium"
              >
                Description
                <SortIcon column="description" />
              </button>
            </TableHead>
            <TableHead className="w-36">
              <button
                onClick={() => handleSort("status")}
                className="flex items-center mx-auto hover:text-foreground transition-colors font-medium"
              >
                Status
                <SortIcon column="status" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPrinters.map((printer) => (
            <TableRow key={printer.id}>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(printer)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell className="font-medium">{printer.name}</TableCell>
              <TableCell className="font-mono text-sm hidden md:table-cell">{printer.ip}</TableCell>
              <TableCell className="text-center hidden md:table-cell">{printer.port}</TableCell>
              <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                {printer.description || "-"}
              </TableCell>
              <TableCell className="text-center">
                <Select
                  value={printer.status}
                  onValueChange={(v) =>
                    handleStatusChange(
                      printer,
                      v as "ONLINE" | "OFFLINE" | "ERROR"
                    )
                  }
                  disabled={updatingId === printer.id}
                >
                  <SelectTrigger className="w-28 mx-auto">
                    <SelectValue>
                      <Badge variant={statusVariants[printer.status]}>
                        {statusLabels[printer.status]}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
