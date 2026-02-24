"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/api-types";
import { IngredientsToolbar } from "./ingredients-toolbar";
import { IngredientsTable } from "./ingredients-table";
import { IngredientDialog } from "./ingredient-dialog";
import { DeleteIngredientDialog } from "./delete-ingredient-dialog";

interface IngredientsContentProps {
  initialIngredients: Ingredient[];
}

export function IngredientsContent({
  initialIngredients,
}: IngredientsContentProps) {
  const [ingredients, setIngredients] =
    useState<Ingredient[]>(initialIngredients);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] =
    useState<Ingredient | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIngredient, setDeletingIngredient] =
    useState<Ingredient | null>(null);

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleCreate() {
    setEditingIngredient(null);
    setDialogOpen(true);
  }

  function handleEdit(ingredient: Ingredient) {
    setEditingIngredient(ingredient);
    setDialogOpen(true);
  }

  function handleDelete(ingredient: Ingredient) {
    setDeletingIngredient(ingredient);
    setDeleteDialogOpen(true);
  }

  function handleSaved(saved: Ingredient) {
    if (editingIngredient) {
      setIngredients((prev) =>
        prev.map((i) => (i.id === saved.id ? saved : i))
      );
    } else {
      setIngredients((prev) => [...prev, saved]);
    }
    setDialogOpen(false);
    setEditingIngredient(null);
  }

  function handleDeleted(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setDeleteDialogOpen(false);
    setDeletingIngredient(null);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <IngredientsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNew={handleCreate}
        />
        <IngredientsTable
          ingredients={filteredIngredients}
          onEdit={handleEdit}
        />
      </div>
      <IngredientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ingredient={editingIngredient}
        onSaved={handleSaved}
        onDelete={handleDelete}
      />
      <DeleteIngredientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        ingredient={deletingIngredient}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
