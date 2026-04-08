"use client";

import { useState, useMemo } from "react";
import { OrderInstruction } from "@/lib/api-types";
import { reorderOrderInstructions } from "@/actions/order-instructions";
import { OrderInstructionsToolbar } from "./order-instructions-toolbar";
import { OrderInstructionsTable } from "./order-instructions-table";
import { OrderInstructionDialog } from "./order-instruction-dialog";
import { DeleteOrderInstructionDialog } from "./delete-order-instruction-dialog";
import { toast } from "sonner";
import { useRole } from "@/hooks/use-role";
import { useLocale } from "@/contexts/locale-context";

interface OrderInstructionsContentProps {
  initialInstructions: OrderInstruction[];
}

export function OrderInstructionsContent({ initialInstructions }: OrderInstructionsContentProps) {
  const { canManageOrderInstructions } = useRole();
  const { t } = useLocale();
  const [instructions, setInstructions] = useState<OrderInstruction[]>(
    [...initialInstructions].sort((a, b) => a.position - b.position)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<OrderInstruction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingInstruction, setDeletingInstruction] = useState<OrderInstruction | null>(null);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const filteredInstructions = useMemo(() => {
    if (!searchQuery) return instructions;
    return instructions.filter((inst) =>
      inst.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [instructions, searchQuery]);

  function handleCreate() {
    setEditingInstruction(null);
    setDialogOpen(true);
  }

  function handleEdit(instruction: OrderInstruction) {
    setEditingInstruction(instruction);
    setDialogOpen(true);
  }

  function handleDelete(instruction: OrderInstruction) {
    setDeletingInstruction(instruction);
    setDeleteDialogOpen(true);
  }

  function handleSaved(saved: OrderInstruction) {
    if (editingInstruction) {
      setInstructions((prev) =>
        prev.map((i) => (i.id === saved.id ? saved : i))
      );
    } else {
      setInstructions((prev) => [...prev, saved]);
    }
    setDialogOpen(false);
    setEditingInstruction(null);
  }

  function handleDeleted(id: string) {
    setInstructions((prev) => prev.filter((i) => i.id !== id));
    setDeleteDialogOpen(false);
    setDeletingInstruction(null);
  }

  function handleReorder(reordered: OrderInstruction[]) {
    setInstructions(reordered);

    const hasChanged = reordered.some((inst, index) => {
      const original = initialInstructions.find((i) => i.id === inst.id);
      return original && original.position !== index;
    });

    setHasOrderChanged(hasChanged);
  }

  async function handleSaveOrder() {
    setIsSavingOrder(true);
    try {
      const reordered = instructions.map((inst, index) => ({ ...inst, position: index }));
      await reorderOrderInstructions(reordered);
      setHasOrderChanged(false);
      toast.success(t.orderInstructions.toastOrderSaved);
    } catch (error) {
      toast.error(t.orderInstructions.toastErrorOrder);
    } finally {
      setIsSavingOrder(false);
    }
  }

  function handleResetOrder() {
    setInstructions([...initialInstructions].sort((a, b) => a.position - b.position));
    setHasOrderChanged(false);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <OrderInstructionsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNew={handleCreate}
          onSaveOrder={handleSaveOrder}
          onResetOrder={handleResetOrder}
          hasOrderChanged={hasOrderChanged}
          isSavingOrder={isSavingOrder}
          canCreate={canManageOrderInstructions}
        />
        <OrderInstructionsTable
          instructions={filteredInstructions}
          onEdit={handleEdit}
          onReorder={handleReorder}
        />
        <OrderInstructionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          instruction={editingInstruction}
          onSaved={handleSaved}
          onDelete={canManageOrderInstructions ? handleDelete : undefined}
          instructionsCount={instructions.length}
        />
        <DeleteOrderInstructionDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          instruction={deletingInstruction}
          onDeleted={handleDeleted}
        />
      </div>
    </div>
  );
}
