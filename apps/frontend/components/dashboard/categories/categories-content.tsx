"use client";

import { useState, useMemo } from "react";
import { Category, Printer, Station } from "@/lib/api-types";
import { reorderCategories } from "@/actions/categories";
import { CategoriesToolbar } from "./categories-toolbar";
import { CategoriesTable } from "./categories-table";
import { CategoryDialog } from "./category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { toast } from "sonner";
import { arrayMove } from "@dnd-kit/sortable";
import { useRole } from "@/hooks/use-role";
import { CategoriesTableSkeleton } from "./categories-table-skeleton";

interface CategoriesContentProps {
  initialCategories: Category[];
  printers: Printer[];
  stations: Station[];
}

export function CategoriesContent({ initialCategories, printers, stations }: CategoriesContentProps) {
  const { canManageCategories, isSessionLoading } = useRole();
  const [categories, setCategories] = useState<Category[]>(
    [...initialCategories].sort((a, b) => a.position - b.position)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [savedOrder, setSavedOrder] = useState<string[]>(() => categories.map((c) => c.id));
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const hasOrderChanged = useMemo(
    () => categories.some((cat, index) => cat.id !== savedOrder[index]),
    [categories, savedOrder]
  );

  function handleCreate() {
    setEditingCategory(null);
    setDialogOpen(true);
  }

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  function handleDelete(category: Category) {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  }

  function handleSaved(saved: Category) {
    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) => (c.id === saved.id ? saved : c))
      );
    } else {
      setCategories((prev) => [...prev, saved]);
      setSavedOrder((prev) => [...prev, saved.id]);
    }
    setDialogOpen(false);
    setEditingCategory(null);
  }

  function handleDeleted(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setSavedOrder((prev) => prev.filter((savedId) => savedId !== id));
    setDeleteDialogOpen(false);
    setDeletingCategory(null);
  }

  function handleToggled(updated: Category) {
    setCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }

  function handleReorder(activeId: string, overId: string) {
    setCategories((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === activeId);
      const newIndex = prev.findIndex((c) => c.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function handleSaveOrder() {
    setIsSavingOrder(true);
    const result = await reorderCategories(categories.map((c) => c.id));
    if (result.ok) {
      setCategories(result.data);
      setSavedOrder(result.data.map((c) => c.id));
      toast.success("Ordine categorie salvato");
    } else {
      toast.error(result.error);
    }
    setIsSavingOrder(false);
  }

  function handleResetOrder() {
    setCategories((prev) => {
      const indexById = new Map(savedOrder.map((id, index) => [id, index]));
      return [...prev].sort((a, b) => (indexById.get(a.id) ?? Infinity) - (indexById.get(b.id) ?? Infinity));
    });
  }

  if (isSessionLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <CategoriesTableSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <CategoriesToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNew={handleCreate}
          onSaveOrder={handleSaveOrder}
          onResetOrder={handleResetOrder}
          hasOrderChanged={hasOrderChanged}
          isSavingOrder={isSavingOrder}
          canCreate={canManageCategories}
        />
        <CategoriesTable
          categories={filteredCategories}
          printers={printers}
          stations={stations}
          onEdit={handleEdit}
          onToggle={handleToggled}
          onReorder={handleReorder}
          isReorderDisabled={searchQuery.length > 0 || isSavingOrder}
        />
        <CategoryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={editingCategory}
          printers={printers}
          stations={stations}
          onSaved={handleSaved}
          onDelete={canManageCategories ? handleDelete : undefined}
        />
        <DeleteCategoryDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          category={deletingCategory}
          onDeleted={handleDeleted}
        />
      </div>
    </div>
  );
}
