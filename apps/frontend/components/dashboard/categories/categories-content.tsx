"use client";

import { useState, useMemo } from "react";
import { Category, Printer } from "@/lib/api-types";
import { reorderCategories } from "@/actions/categories";
import { CategoriesToolbar } from "./categories-toolbar";
import { CategoriesTable } from "./categories-table";
import { CategoryDialog } from "./category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { toast } from "sonner";

interface CategoriesContentProps {
  initialCategories: Category[];
  printers: Printer[];
}

export function CategoriesContent({ initialCategories, printers }: CategoriesContentProps) {
  const [categories, setCategories] = useState<Category[]>(
    [...initialCategories].sort((a, b) => a.position - b.position)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

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
    }
    setDialogOpen(false);
    setEditingCategory(null);
  }

  function handleDeleted(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteDialogOpen(false);
    setDeletingCategory(null);
  }

  function handleToggled(updated: Category) {
    setCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }

  function handleReorder(reordered: Category[]) {
    setCategories(reordered);

    // Verifica se l'ordine è effettivamente cambiato rispetto a quello iniziale
    const hasChanged = reordered.some((cat, index) => {
      const originalCategory = initialCategories.find(c => c.id === cat.id);
      return originalCategory && originalCategory.position !== index;
    });

    setHasOrderChanged(hasChanged);
  }

  async function handleSaveOrder() {
    setIsSavingOrder(true);
    try {
      const positions = categories.map((cat, index) => ({
        id: cat.id,
        position: index,
      }));
      await reorderCategories(positions);
      setHasOrderChanged(false);
      toast.success("Ordine categorie salvato");
    } catch (error) {
      toast.error("Errore durante il salvataggio dell'ordine");
    } finally {
      setIsSavingOrder(false);
    }
  }

  function handleResetOrder() {
    setCategories([...initialCategories].sort((a, b) => a.position - b.position));
    setHasOrderChanged(false);
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
        />
        <CategoriesTable
          categories={filteredCategories}
          printers={printers}
          onEdit={handleEdit}
          onToggle={handleToggled}
          onReorder={handleReorder}
        />
        <CategoryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={editingCategory}
          printers={printers}
          onSaved={handleSaved}
          onDelete={handleDelete}
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
