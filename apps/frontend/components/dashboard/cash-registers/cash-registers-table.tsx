"use client";

import { useState, useMemo, useEffect } from "react";
import { CashRegister, Printer } from "@/lib/api-types";
import { toggleCashRegisterEnabled } from "@/actions/cash-registers";
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
import { Checkbox } from "@/components/ui/checkbox";
import { PencilIcon, ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from "lucide-react";
import { toast } from "sonner";

interface CashRegistersTableProps {
  cashRegisters: CashRegister[];
  printers: Printer[];
  onEdit: (cashRegister: CashRegister) => void;
  onToggle: (updated: CashRegister) => void;
}

type SortColumn = "name" | "printer" | "enabled" | null;
type SortDirection = "asc" | "desc";

export function CashRegistersTable({
  cashRegisters,
  printers,
  onEdit,
  onToggle,
}: CashRegistersTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    const savedColumn = localStorage.getItem("cash-registers-table-sort-column");
    const savedDirection = localStorage.getItem("cash-registers-table-sort-direction");
    if (savedColumn) {
      setSortColumn(savedColumn as SortColumn);
    }
    if (savedDirection) {
      setSortDirection(savedDirection as SortDirection);
    }
  }, []);

  useEffect(() => {
    if (sortColumn) {
      localStorage.setItem("cash-registers-table-sort-column", sortColumn);
    } else {
      localStorage.removeItem("cash-registers-table-sort-column");
    }
    localStorage.setItem("cash-registers-table-sort-direction", sortDirection);
  }, [sortColumn, sortDirection]);

  function getPrinterName(printerId: string): string {
    const printer = printers.find((p) => p.id === printerId);
    return printer?.name || printerId;
  }

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

  const sortedCashRegisters = useMemo(() => {
    if (!sortColumn) return cashRegisters;

    return [...cashRegisters].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "printer":
          aValue = (a.defaultPrinter?.name || getPrinterName(a.defaultPrinterId)).toLowerCase();
          bValue = (b.defaultPrinter?.name || getPrinterName(b.defaultPrinterId)).toLowerCase();
          break;
        case "enabled":
          aValue = a.enabled ? 1 : 0;
          bValue = b.enabled ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [cashRegisters, sortColumn, sortDirection, printers]);

  async function handleToggle(cashRegister: CashRegister) {
    setTogglingId(cashRegister.id);
    try {
      const updated = await toggleCashRegisterEnabled(
        cashRegister.id,
        !cashRegister.enabled
      );
      onToggle(updated);
      toast.success(
        `Register "${cashRegister.name}" ${updated.enabled ? "enabled" : "disabled"}`
      );
    } catch (error) {
      toast.error("Error updating register");
    } finally {
      setTogglingId(null);
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

  if (sortedCashRegisters.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">
          No cash registers found
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
            <TableHead className="w-48">
              <button
                onClick={() => handleSort("printer")}
                className="flex items-center hover:text-foreground transition-colors font-medium"
              >
                Printer
                <SortIcon column="printer" />
              </button>
            </TableHead>
            <TableHead className="w-32">
              <button
                onClick={() => handleSort("enabled")}
                className="flex items-center mx-auto hover:text-foreground transition-colors font-medium"
              >
                Enabled
                <SortIcon column="enabled" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCashRegisters.map((cr) => (
            <TableRow key={cr.id}>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(cr)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell className="font-medium">{cr.name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {cr.defaultPrinter
                    ? cr.defaultPrinter.name
                    : getPrinterName(cr.defaultPrinterId)}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center">
                  <Checkbox
                    checked={cr.enabled}
                    disabled={togglingId === cr.id}
                    onCheckedChange={() => handleToggle(cr)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
