"use client";

import { useState } from "react";
import { Food, Category, Ingredient, Printer } from "@/lib/api-types";
import { FoodsToolbar } from "./foods-toolbar";
import { FoodsTable } from "./foods-table";
import { FoodDialog } from "./food-dialog";
import { DeleteFoodDialog } from "./delete-food-dialog";

interface FoodsContentProps {
  initialFoods: Food[];
  categories: Category[];
  ingredients: Ingredient[];
  printers: Printer[];
}

export function FoodsContent({ initialFoods, categories, ingredients, printers }: FoodsContentProps) {
  const [foods, setFoods] = useState<Food[]>(initialFoods);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFood, setDeletingFood] = useState<Food | null>(null);

  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || food.category?.name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function handleCreate() {
    setEditingFood(null);
    setDialogOpen(true);
  }

  function handleEdit(food: Food) {
    setEditingFood(food);
    setDialogOpen(true);
  }

  function handleDelete(food: Food) {
    setDeletingFood(food);
    setDeleteDialogOpen(true);
  }

  function handleSaved(saved: Food) {
    if (editingFood) {
      setFoods((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
    } else {
      setFoods((prev) => [...prev, saved]);
    }
    setDialogOpen(false);
    setEditingFood(null);
  }

  function handleDeleted(id: string) {
    setFoods((prev) => prev.filter((f) => f.id !== id));
    setDeleteDialogOpen(false);
    setDeletingFood(null);
  }

  function handleToggled(updated: Food) {
    setFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }

  const categoryNames = Array.from(
    new Set(foods.map((f) => f.category?.name).filter(Boolean))
  ) as string[];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <FoodsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categoryNames={categoryNames}
          onCreateNew={handleCreate}
        />
        <FoodsTable
          foods={filteredFoods}
          onEdit={handleEdit}
          onToggle={handleToggled}
        />
      </div>
      <FoodDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        food={editingFood}
        categories={categories}
        ingredients={ingredients}
        printers={printers}
        onSaved={handleSaved}
        onDelete={handleDelete}
      />
      <DeleteFoodDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        food={deletingFood}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
