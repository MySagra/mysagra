"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  EllipsisIcon,
  PlusIcon,
  SearchIcon,
  PencilIcon,
  CirclePauseIcon,
  CirclePlayIcon,
  Trash2Icon,
  UtensilsCrossedIcon,
  WheatIcon,
  XIcon,
} from "lucide-react";
import { Category, Food, Ingredient, Printer, Station } from "@/lib/api-types";
import { toggleFoodAvailability } from "@/actions/foods";
import { reorderCategories, toggleCategoryAvailability } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useLocale } from "@/contexts/locale-context";
import { useRole } from "@/hooks/use-role";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AvailabilityChip } from "./availability-control";
import { ALL_CATEGORIES, CategorySidebar, CategoryThumb } from "./category-sidebar";
import { FoodList, type FoodGroup } from "./food-list";
import { FoodEditor } from "./food-editor";
import { ExtrasTab } from "./extras-tab";
import { IngredientEditor } from "./ingredient-editor";
import { CategoryDialog } from "./category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { DeleteFoodDialog } from "./delete-food-dialog";
import { IngredientDialog } from "./ingredient-dialog";
import { DeleteIngredientDialog } from "./delete-ingredient-dialog";
import { applyCategoryToFoods, fill, matchesQuery, sortCategories } from "./menu-utils";

export type MenuTab = "dishes" | "extras";

type EditorState =
  | { mode: "edit"; foodId: string }
  | { mode: "create"; categoryId: string | null }
  | null;

type IngredientEditorState =
  | { mode: "edit"; ingredientId: string }
  | { mode: "create" }
  | null;

type IngredientDialogState = {
  ingredient: Ingredient | null;
  defaultName?: string;
  onCreated?: (ingredient: Ingredient) => void;
} | null;

interface MenuContentProps {
  initialTab: MenuTab;
  initialFoods: Food[];
  initialCategories: Category[];
  initialIngredients: Ingredient[];
  printers: Printer[];
  stations: Station[];
}

/** Il pannello laterale fisso serve spazio: sotto questa soglia l'editor è uno sheet. */
const WIDE_QUERY = "(min-width: 1280px)";

export function MenuContent({
  initialTab,
  initialFoods,
  initialCategories,
  initialIngredients,
  printers,
  stations,
}: MenuContentProps) {
  const { t } = useLocale();
  const { isSessionLoading, isReadOnly, canDelete, canEditCategories, canManageCategories } = useRole();
  const canEdit = !isSessionLoading && !isReadOnly;
  const isWide = useMediaQuery(WIDE_QUERY);

  const [tab, setTab] = useState<MenuTab>(initialTab);
  const [foods, setFoods] = useState(initialFoods);
  const [categories, setCategories] = useState(() => sortCategories(initialCategories));
  const [ingredients, setIngredients] = useState(initialIngredients);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ALL_CATEGORIES);
  const [search, setSearch] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const [editor, setEditor] = useState<EditorState>(null);
  const dirtyRef = useRef(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const [categoryDialog, setCategoryDialog] = useState<{ category: Category | null } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deletingFood, setDeletingFood] = useState<Food | null>(null);
  const [ingredientDialog, setIngredientDialog] = useState<IngredientDialogState>(null);
  const [ingredientEditor, setIngredientEditor] = useState<IngredientEditorState>(null);
  const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;
  const editingFood = editor?.mode === "edit" ? foods.find((f) => f.id === editor.foodId) ?? null : null;

  const foodCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of foods) counts.set(f.categoryId, (counts.get(f.categoryId) ?? 0) + 1);
    return counts;
  }, [foods]);

  const query = search.trim();
  const groups: FoodGroup[] = useMemo(() => {
    const byCategory = (c: Category) =>
      foods
        .filter((f) => f.categoryId === c.id)
        .sort((a, b) => a.name.localeCompare(b.name));
    // La ricerca resta nella categoria selezionata, o in tutto il menù
    const visible = selectedCategory ? [selectedCategory] : categories;
    if (query) {
      return visible
        .map((c) => ({
          category: c,
          foods: byCategory(c).filter(
            (f) => matchesQuery(f.name, query) || matchesQuery(f.description, query)
          ),
        }))
        .filter((g) => g.foods.length > 0);
    }
    return visible.map((c) => ({ category: c, foods: byCategory(c) }));
  }, [foods, categories, selectedCategory, query]);

  const scopeFoods = selectedCategory
    ? foods.filter((f) => f.categoryId === selectedCategory.id)
    : foods;
  const unavailableCount = scopeFoods.filter((f) => !f.available).length;

  // ── Tabs ────────────────────────────────────────────────────────────
  function changeTab(next: MenuTab) {
    if (next === tab) return;
    guarded(() => switchTab(next));
  }

  function switchTab(next: MenuTab) {
    setTab(next);
    const url = next === "extras" ? "?tab=extras" : window.location.pathname;
    window.history.replaceState(null, "", url);
  }

  // ── Editor & unsaved-changes guard ─────────────────────────────────
  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  function guarded(action: () => void) {
    if (dirtyRef.current) {
      setPendingNavigation(() => action);
    } else {
      action();
    }
  }

  function openFood(food: Food) {
    if (editor?.mode === "edit" && editor.foodId === food.id) return;
    guarded(() => setEditor({ mode: "edit", foodId: food.id }));
  }

  function openNewFood(categoryId?: string | null) {
    guarded(() => {
      switchTab("dishes");
      setEditor({
        mode: "create",
        categoryId: categoryId ?? selectedCategory?.id ?? null,
      });
    });
  }

  function closeEditor(force?: boolean) {
    if (force) {
      dirtyRef.current = false;
      setEditor(null);
    } else {
      guarded(() => setEditor(null));
    }
  }

  function handleFoodSaved(saved: Food, isNew: boolean) {
    dirtyRef.current = false;
    setFoods((prev) =>
      isNew ? [...prev, saved] : prev.map((f) => (f.id === saved.id ? { ...f, ...saved } : f))
    );
    if (isNew) setEditor({ mode: "edit", foodId: saved.id });
  }

  function handleFoodDeleted(id: string) {
    setFoods((prev) => prev.filter((f) => f.id !== id));
    setDeletingFood(null);
    if (editor?.mode === "edit" && editor.foodId === id) closeEditor(true);
  }

  // ── Availability ───────────────────────────────────────────────────
  function setPending(id: string, pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function toggleFood(food: Food) {
    const next = !food.available;
    setPending(food.id, true);
    setFoods((prev) => prev.map((f) => (f.id === food.id ? { ...f, available: next } : f)));
    try {
      await toggleFoodAvailability(food.id, next);
      toast.success(fill(next ? t.menu.toastNowAvailable : t.menu.toastNowUnavailable, { name: food.name }), {
        action: { label: t.menu.undo, onClick: () => toggleFood({ ...food, available: next }) },
      });
    } catch {
      setFoods((prev) => prev.map((f) => (f.id === food.id ? { ...f, available: food.available } : f)));
      toast.error(t.foods.toastErrorUpdate);
    } finally {
      setPending(food.id, false);
    }
  }

  async function toggleCategory(category: Category) {
    const next = !category.available;
    setPending(category.id, true);
    const result = await toggleCategoryAvailability(category.id, next);
    if (result.ok) {
      const updated = result.data;
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      setFoods((prev) => applyCategoryToFoods(prev, updated));
      toast.success(fill(next ? t.menu.toastNowAvailable : t.menu.toastNowUnavailable, { name: category.name }));
    } else {
      toast.error(result.error || t.categories.toastErrorUpdate);
    }
    setPending(category.id, false);
  }

  // ── Categories ─────────────────────────────────────────────────────
  async function handleReorder(reordered: Category[]) {
    const previous = categories;
    // optimistic update, the server answers with the saved order
    setCategories(reordered.map((c, index) => ({ ...c, position: index })));
    const result = await reorderCategories(reordered.map((c) => c.id));
    if (result.ok) {
      setCategories(result.data);
      toast.success(t.menu.orderSaved);
    } else {
      setCategories(previous);
      toast.error(result.error || t.menu.orderError);
    }
  }

  function handleCategorySaved(saved: Category) {
    const isNew = !categories.some((c) => c.id === saved.id);
    setCategories((prev) =>
      sortCategories(isNew ? [...prev, saved] : prev.map((c) => (c.id === saved.id ? saved : c)))
    );
    if (isNew) {
      setSelectedCategoryId(saved.id);
      setSearch("");
    } else {
      setFoods((prev) => applyCategoryToFoods(prev, saved));
    }
    setCategoryDialog(null);
  }

  function handleCategoryDeleted(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setFoods((prev) => prev.filter((f) => f.categoryId !== id));
    if (selectedCategoryId === id) setSelectedCategoryId(ALL_CATEGORIES);
    if (editingFood?.categoryId === id) closeEditor(true);
    setDeletingCategory(null);
  }

  // ── Ingredients ────────────────────────────────────────────────────
  function openIngredient(ingredient: Ingredient) {
    if (ingredientEditor?.mode === "edit" && ingredientEditor.ingredientId === ingredient.id) return;
    guarded(() => setIngredientEditor({ mode: "edit", ingredientId: ingredient.id }));
  }

  function openNewIngredient() {
    guarded(() => {
      switchTab("extras");
      setIngredientEditor({ mode: "create" });
    });
  }

  function closeIngredientEditor(force?: boolean) {
    if (force) {
      dirtyRef.current = false;
      setIngredientEditor(null);
    } else {
      guarded(() => setIngredientEditor(null));
    }
  }

  function openFoodFromIngredient(food: Food) {
    guarded(() => {
      switchTab("dishes");
      setSearch("");
      setSelectedCategoryId(food.categoryId);
      setEditor({ mode: "edit", foodId: food.id });
    });
  }

  function handleIngredientEditorSaved(saved: Ingredient, isNew: boolean) {
    dirtyRef.current = false;
    storeIngredient(saved);
    if (isNew) setIngredientEditor({ mode: "edit", ingredientId: saved.id });
  }

  function handleIngredientSaved(saved: Ingredient) {
    storeIngredient(saved);
    ingredientDialog?.onCreated?.(saved);
    setIngredientDialog(null);
  }

  function storeIngredient(saved: Ingredient) {
    const isNew = !ingredients.some((i) => i.id === saved.id);
    setIngredients((prev) => (isNew ? [...prev, saved] : prev.map((i) => (i.id === saved.id ? saved : i))));
    if (!isNew) {
      setFoods((prev) =>
        prev.map((f) => ({
          ...f,
          ingredients: f.ingredients?.map((i) => (i.id === saved.id ? saved : i)),
        }))
      );
    }
  }

  function handleIngredientDeleted(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setFoods((prev) =>
      prev.map((f) => ({ ...f, ingredients: f.ingredients?.filter((i) => i.id !== id) }))
    );
    setDeletingIngredient(null);
    if (ingredientEditor?.mode === "edit" && ingredientEditor.ingredientId === id) {
      closeIngredientEditor(true);
    }
  }

  const editingIngredient =
    ingredientEditor?.mode === "edit"
      ? ingredients.find((i) => i.id === ingredientEditor.ingredientId) ?? null
      : null;

  // ── Render helpers ─────────────────────────────────────────────────
  function renderCategoryMenu(category: Category) {
    if (!canEditCategories) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t.menu.categoryActions}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setCategoryDialog({ category })}>
            <PencilIcon />
            {t.menu.categorySettings}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toggleCategory(category)}>
            {category.available ? <CirclePauseIcon /> : <CirclePlayIcon />}
            {category.available ? t.menu.makeCategoryUnavailable : t.menu.makeCategoryAvailable}
          </DropdownMenuItem>
          {canManageCategories && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeletingCategory(category)}>
                <Trash2Icon />
                {t.menu.deleteCategory}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const editorNode = editor && (
    <FoodEditor
      key={editor.mode === "edit" ? editor.foodId : `new-${editor.categoryId}`}
      food={editingFood}
      defaultCategoryId={editor.mode === "create" ? editor.categoryId : null}
      categories={categories}
      ingredients={ingredients}
      printers={printers}
      foods={foods}
      canEdit={canEdit}
      canDelete={canDelete}
      onSaved={handleFoodSaved}
      onDeleteRequest={setDeletingFood}
      onClose={closeEditor}
      onDirtyChange={handleDirtyChange}
      onCreateIngredient={(name, onCreated) =>
        setIngredientDialog({ ingredient: null, defaultName: name, onCreated })
      }
    />
  );

  const ingredientEditorNode = ingredientEditor && (
    <IngredientEditor
      key={editingIngredient?.id ?? "new"}
      ingredient={editingIngredient}
      ingredients={ingredients}
      usedBy={
        editingIngredient
          ? foods.filter((f) => f.ingredients?.some((i) => i.id === editingIngredient.id))
          : []
      }
      canEdit={canEdit}
      canDelete={canDelete}
      onSaved={handleIngredientEditorSaved}
      onDeleteRequest={setDeletingIngredient}
      onClose={closeIngredientEditor}
      onDirtyChange={handleDirtyChange}
      onOpenFood={openFoodFromIngredient}
    />
  );

  const panelNode = tab === "dishes" ? editorNode : ingredientEditorNode;

  const selectedPrinter = printers.find((p) => p.id === selectedCategory?.printerId);
  const selectedStation = stations.find((s) => s.id === selectedCategory?.stationId);

  return (
    <>
    <DashboardHeader
      navKey="menu"
      actions={
        <>
          <Tabs value={tab} onValueChange={(v) => changeTab(v as MenuTab)} className="lg:hidden">
            <TabsList className="h-9!">
              <TabsTrigger value="dishes" className="px-3">{t.menu.tabDishes}</TabsTrigger>
              <TabsTrigger value="extras" className="px-3">{t.menu.tabExtras}</TabsTrigger>
            </TabsList>
          </Tabs>
          {canEdit && tab === "dishes" && categories.length > 0 && (
            <Button size="lg" onClick={() => openNewFood()}>
              <PlusIcon />
              <span className="hidden sm:inline">{t.menu.newDish}</span>
              <span className="sr-only sm:hidden">{t.menu.newDish}</span>
            </Button>
          )}
          {canEdit && tab === "extras" && (
            <Button size="lg" onClick={openNewIngredient}>
              <PlusIcon />
              <span className="hidden sm:inline">{t.menu.newExtra}</span>
              <span className="sr-only sm:hidden">{t.menu.newExtra}</span>
            </Button>
          )}
        </>
      }
    />
    {/* Su desktop la pagina non scorre: scorrono solo le singole colonne */}
    <div className="flex flex-1 flex-col gap-4 px-4 pb-24 md:pb-4 lg:h-[calc(100svh-5rem)] lg:min-h-0 lg:flex-none lg:overflow-hidden">
        <div
          className={cn(
            "grid flex-1 items-start gap-6 lg:min-h-0 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-stretch",
            (tab === "extras" || categories.length > 0) && "xl:grid-cols-[15rem_minmax(0,1fr)_24rem]"
          )}
        >
          {/* Colonna categorie (desktop) */}
          <aside className="hidden min-h-0 overflow-y-auto pr-1 lg:block">
            <CategorySidebar
              categories={categories}
              printers={printers}
              foodCounts={foodCounts}
              totalFoods={foods.length}
              view={tab}
              ingredientCount={ingredients.length}
              selectedId={selectedCategoryId}
              canReorder={canEditCategories}
              canCreate={canManageCategories}
              onSelect={(id) => {
                changeTab("dishes");
                setSelectedCategoryId(id);
                setSearch("");
              }}
              onSelectIngredients={() => changeTab("extras")}
              onReorder={handleReorder}
              onCreate={() => setCategoryDialog({ category: null })}
            />
          </aside>

          {tab === "extras" ? (
            <ExtrasTab
              ingredients={ingredients}
              foods={foods}
              selectedId={editingIngredient?.id ?? null}
              canEdit={canEdit}
              onCreate={openNewIngredient}
              onSelect={openIngredient}
            />
          ) : categories.length === 0 ? (
            <section className="min-w-0">
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                <UtensilsCrossedIcon className="size-5 text-primary-foreground dark:text-primary" />
              </span>
              <p className="text-lg font-semibold">{t.menu.emptyMenuTitle}</p>
              <p className="max-w-sm text-sm text-muted-foreground">{t.menu.emptyMenuDescription}</p>
              {canManageCategories && (
                <Button size="lg" onClick={() => setCategoryDialog({ category: null })}>
                  <PlusIcon />
                  {t.menu.createFirstCategory}
                </Button>
              )}
            </div>
            </section>
          ) : (
          /* Lista piatti */
          <section className="flex min-w-0 flex-col gap-4 lg:min-h-0">
            {selectedCategory && (
              <div className="hidden items-center gap-3 rounded-xl border bg-card p-3 lg:flex">
                <CategoryThumb category={selectedCategory} className="size-11" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold">{selectedCategory.name}</h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {[
                      selectedPrinter
                        ? fill(t.menu.printsOn, { printer: selectedPrinter.name })
                        : t.menu.noPrinter,
                      selectedStation && fill(t.menu.pickupAt, { station: selectedStation.name }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <AvailabilityChip
                  available={selectedCategory.available}
                  pending={pendingIds.has(selectedCategory.id)}
                  onToggle={canEditCategories ? () => toggleCategory(selectedCategory) : undefined}
                />
                {renderCategoryMenu(selectedCategory)}
              </div>
            )}

            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  selectedCategory
                    ? fill(t.menu.searchInCategory, { name: selectedCategory.name })
                    : t.menu.searchPlaceholder
                }
                className="h-10 pr-9 pl-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={t.menu.close}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>

            {/* Filtro categorie (mobile/tablet) */}
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
              {[{ id: ALL_CATEGORIES, name: t.menu.allDishes }, ...categories].map((c) => {
                const active = selectedCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(c.id);
                      setSearch("");
                    }}
                    className={cn(
                      "h-9 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
              {canManageCategories && (
                <button
                  type="button"
                  onClick={() => setCategoryDialog({ category: null })}
                  className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-dashed px-3 text-sm text-muted-foreground"
                >
                  <PlusIcon className="size-4" />
                  {t.menu.newCategory}
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {fill(t.menu.summary, { total: scopeFoods.length, unavailable: unavailableCount })}
            </p>

            <div className="lg:-mx-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-1 lg:pb-4">
            {query && groups.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {fill(t.menu.noResults, { q: query })}
              </p>
            ) : (
              <FoodList
                groups={groups}
                selectedFoodId={editor?.mode === "edit" ? editor.foodId : null}
                pendingIds={pendingIds}
                canEdit={canEdit}
                groupHeaderClassName={selectedCategory ? "lg:hidden" : undefined}
                renderGroupActions={renderCategoryMenu}
                onSelect={openFood}
                onToggle={toggleFood}
                onAddDish={openNewFood}
              />
            )}
            </div>
          </section>
          )}

          {/* Pannello editor (schermi larghi) */}
          {(tab === "extras" || categories.length > 0) && (
          <aside className="hidden min-h-0 overflow-hidden rounded-xl border bg-card xl:block">
            {panelNode && isWide ? (
              panelNode
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                {tab === "dishes" ? (
                  <UtensilsCrossedIcon className="size-8 text-muted-foreground/60" />
                ) : (
                  <WheatIcon className="size-8 text-muted-foreground/60" />
                )}
                <p className="font-medium">
                  {tab === "dishes" ? t.menu.selectDishTitle : t.menu.selectIngredientTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tab === "dishes" ? t.menu.selectDishHint : t.menu.selectIngredientHint}
                </p>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => (tab === "dishes" ? openNewFood() : openNewIngredient())}
                  >
                    <PlusIcon />
                    {tab === "dishes" ? t.menu.newDish : t.menu.newExtra}
                  </Button>
                )}
              </div>
            )}
          </aside>
          )}
        </div>

      {/* Editor come sheet (mobile/tablet) */}
      <Sheet
        open={!!panelNode && !isWide}
        onOpenChange={(open) => {
          if (open) return;
          if (tab === "dishes") closeEditor();
          else closeIngredientEditor();
        }}
      >
        <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0 sm:max-w-md">
          <SheetTitle className="sr-only">
            {tab === "dishes"
              ? editingFood?.name ?? t.menu.editorNewTitle
              : editingIngredient?.name ?? t.menu.newExtra}
          </SheetTitle>
          {!isWide && panelNode}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingNavigation} onOpenChange={(open) => !open && setPendingNavigation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.menu.unsavedTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.menu.unsavedDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.menu.keepEditing}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                dirtyRef.current = false;
                pendingNavigation?.();
                setPendingNavigation(null);
              }}
            >
              {t.menu.discard}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CategoryDialog
        open={!!categoryDialog}
        onOpenChange={(open) => !open && setCategoryDialog(null)}
        category={categoryDialog?.category ?? null}
        printers={printers}
        stations={stations}
        onSaved={handleCategorySaved}
        onDelete={canManageCategories ? setDeletingCategory : undefined}
      />
      <DeleteCategoryDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        category={deletingCategory}
        onDeleted={handleCategoryDeleted}
      />
      <DeleteFoodDialog
        open={!!deletingFood}
        onOpenChange={(open) => !open && setDeletingFood(null)}
        food={deletingFood}
        onDeleted={handleFoodDeleted}
      />
      <IngredientDialog
        open={!!ingredientDialog}
        onOpenChange={(open) => !open && setIngredientDialog(null)}
        ingredient={ingredientDialog?.ingredient ?? null}
        defaultName={ingredientDialog?.defaultName}
        onSaved={handleIngredientSaved}
      />
      <DeleteIngredientDialog
        open={!!deletingIngredient}
        onOpenChange={(open) => !open && setDeletingIngredient(null)}
        ingredient={deletingIngredient}
        onDeleted={handleIngredientDeleted}
      />
    </div>
    </>
  );
}
