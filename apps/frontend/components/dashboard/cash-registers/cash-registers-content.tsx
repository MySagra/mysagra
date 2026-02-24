"use client";

import { useState } from "react";
import { CashRegister, Printer } from "@/lib/api-types";
import { CashRegistersToolbar } from "./cash-registers-toolbar";
import { CashRegistersTable } from "./cash-registers-table";
import { CashRegisterDialog } from "./cash-register-dialog";
import { DeleteCashRegisterDialog } from "./delete-cash-register-dialog";

interface CashRegistersContentProps {
  initialCashRegisters: CashRegister[];
  printers: Printer[];
}

export function CashRegistersContent({
  initialCashRegisters,
  printers,
}: CashRegistersContentProps) {
  const [cashRegisters, setCashRegisters] =
    useState<CashRegister[]>(initialCashRegisters);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCashRegister, setEditingCashRegister] =
    useState<CashRegister | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCashRegister, setDeletingCashRegister] =
    useState<CashRegister | null>(null);

  const filteredCashRegisters = cashRegisters.filter((cr) =>
    cr.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleCreate() {
    setEditingCashRegister(null);
    setDialogOpen(true);
  }

  function handleEdit(cashRegister: CashRegister) {
    setEditingCashRegister(cashRegister);
    setDialogOpen(true);
  }

  function handleDelete(cashRegister: CashRegister) {
    setDeletingCashRegister(cashRegister);
    setDeleteDialogOpen(true);
  }

  function handleSaved(saved: CashRegister) {
    if (editingCashRegister) {
      setCashRegisters((prev) =>
        prev.map((cr) => (cr.id === saved.id ? saved : cr))
      );
    } else {
      setCashRegisters((prev) => [...prev, saved]);
    }
    setDialogOpen(false);
    setEditingCashRegister(null);
  }

  function handleDeleted(id: string) {
    setCashRegisters((prev) => prev.filter((cr) => cr.id !== id));
    setDeleteDialogOpen(false);
    setDeletingCashRegister(null);
  }

  function handleToggled(updated: CashRegister) {
    setCashRegisters((prev) =>
      prev.map((cr) => (cr.id === updated.id ? updated : cr))
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <CashRegistersToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNew={handleCreate}
        />
        <CashRegistersTable
          cashRegisters={filteredCashRegisters}
          printers={printers}
          onEdit={handleEdit}
          onToggle={handleToggled}
        />
      </div>
      <CashRegisterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cashRegister={editingCashRegister}
        printers={printers}
        onSaved={handleSaved}
        onDelete={handleDelete}
      />
      <DeleteCashRegisterDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        cashRegister={deletingCashRegister}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
