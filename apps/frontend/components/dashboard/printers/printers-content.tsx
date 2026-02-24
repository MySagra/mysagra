"use client";

import { useState } from "react";
import { Printer } from "@/lib/api-types";
import { PrintersToolbar } from "./printers-toolbar";
import { PrintersTable } from "./printers-table";
import { PrinterDialog } from "./printer-dialog";
import { DeletePrinterDialog } from "./delete-printer-dialog";

interface PrintersContentProps {
  initialPrinters: Printer[];
}

export function PrintersContent({ initialPrinters }: PrintersContentProps) {
  const [printers, setPrinters] = useState<Printer[]>(initialPrinters);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPrinter, setDeletingPrinter] = useState<Printer | null>(null);

  const filteredPrinters = printers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleCreate() {
    setEditingPrinter(null);
    setDialogOpen(true);
  }

  function handleEdit(printer: Printer) {
    setEditingPrinter(printer);
    setDialogOpen(true);
  }

  function handleDelete(printer: Printer) {
    setDeletingPrinter(printer);
    setDeleteDialogOpen(true);
  }

  function handleSaved(saved: Printer) {
    if (editingPrinter) {
      setPrinters((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    } else {
      setPrinters((prev) => [...prev, saved]);
    }
    setDialogOpen(false);
    setEditingPrinter(null);
  }

  function handleDeleted(id: string) {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
    setDeleteDialogOpen(false);
    setDeletingPrinter(null);
  }

  function handleStatusUpdated(updated: Printer) {
    setPrinters((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <PrintersToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNew={handleCreate}
        />
        <PrintersTable
          printers={filteredPrinters}
          onEdit={handleEdit}
          onStatusUpdate={handleStatusUpdated}
        />
      </div>
      <PrinterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        printer={editingPrinter}
        onSaved={handleSaved}
        onDelete={handleDelete}
      />
      <DeletePrinterDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        printer={deletingPrinter}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
