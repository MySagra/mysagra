"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { GripVerticalIcon, LayoutListIcon, PlusIcon, WheatIcon, type LucideIcon } from "lucide-react";
import { Category, Printer } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";
import { fill } from "./menu-utils";

export const ALL_CATEGORIES = "all";

interface CategorySidebarProps {
  categories: Category[];
  printers: Printer[];
  foodCounts: Map<string, number>;
  totalFoods: number;
  /** Vista attiva: piatti o catalogo ingredienti */
  view: "dishes" | "extras";
  ingredientCount: number;
  selectedId: string;
  canReorder: boolean;
  canCreate: boolean;
  onSelect: (id: string) => void;
  onSelectIngredients: () => void;
  onReorder: (reordered: Category[]) => void;
  onCreate: () => void;
}

export function CategorySidebar({
  categories,
  printers,
  foodCounts,
  totalFoods,
  view,
  ingredientCount,
  selectedId,
  canReorder,
  canCreate,
  onSelect,
  onSelectIngredients,
  onReorder,
  onCreate,
}: CategorySidebarProps) {
  const { t } = useLocale();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = categories.findIndex((c) => c.id === active.id);
    const to = categories.findIndex((c) => c.id === over.id);
    onReorder(arrayMove(categories, from, to));
  }

  return (
    <nav aria-label={t.nav.menu} className="space-y-1">
      <CategoryButton
        selected={view === "dishes" && selectedId === ALL_CATEGORIES}
        onClick={() => onSelect(ALL_CATEGORIES)}
        thumb={<IconThumb icon={LayoutListIcon} />}
        title={t.menu.allDishes}
        subtitle={fill(t.menu.dishCountMany, { n: totalFoods })}
      />
      <CategoryButton
        selected={view === "extras"}
        onClick={onSelectIngredients}
        thumb={<IconThumb icon={WheatIcon} />}
        title={t.menu.allIngredients}
        subtitle={
          ingredientCount === 1
            ? t.menu.extrasCountOne
            : fill(t.menu.extrasCountMany, { n: ingredientCount })
        }
      />

      <p className="px-2 pt-5 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {t.menu.categoriesHeading}
      </p>

      <DndContext
        id="menu-categories-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1">
            {categories.map((category) => {
              const count = foodCounts.get(category.id) ?? 0;
              const printer = printers.find((p) => p.id === category.printerId);
              const subtitle = [
                count === 1 ? t.menu.dishCountOne : fill(t.menu.dishCountMany, { n: count }),
                printer ? fill(t.menu.printsOn, { printer: printer.name }) : t.menu.noPrinter,
              ].join(" · ");
              return (
                <SortableCategory
                  key={category.id}
                  category={category}
                  subtitle={subtitle}
                  selected={view === "dishes" && selectedId === category.id}
                  canReorder={canReorder}
                  onSelect={onSelect}
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>

      {canCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <PlusIcon className="size-4" />
          {t.menu.newCategory}
        </button>
      )}
    </nav>
  );
}

function SortableCategory({
  category,
  subtitle,
  selected,
  canReorder,
  onSelect,
}: {
  category: Category;
  subtitle: string;
  selected: boolean;
  canReorder: boolean;
  onSelect: (id: string) => void;
}) {
  const { t } = useLocale();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id, disabled: !canReorder });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group/category relative", isDragging && "z-10 opacity-80")}
    >
      <CategoryButton
        selected={selected}
        onClick={() => onSelect(category.id)}
        thumb={<CategoryThumb category={category} />}
        title={category.name}
        subtitle={subtitle}
        unavailable={!category.available}
      />
      {canReorder && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`${t.menu.dragToReorder}: ${category.name}`}
          className="absolute top-1/2 right-1 -translate-y-1/2 cursor-grab touch-none rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover/category:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
        >
          <GripVerticalIcon className="size-4" />
        </button>
      )}
    </li>
  );
}

function CategoryButton({
  selected,
  onClick,
  thumb,
  title,
  subtitle,
  unavailable,
}: {
  selected: boolean;
  onClick: () => void;
  thumb: React.ReactNode;
  title: string;
  subtitle: string;
  unavailable?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected || undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg p-1.5 pr-7 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50",
        selected && "bg-muted"
      )}
    >
      {thumb}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{title}</span>
          {unavailable && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-destructive" />}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

export function CategoryThumb({ category, className }: { category: Category; className?: string }) {
  if (category.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/images/categories/${category.image}`}
        alt=""
        className={cn("size-9 shrink-0 rounded-lg object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary-foreground dark:text-primary",
        className
      )}
    >
      {category.name.charAt(0).toUpperCase()}
    </span>
  );
}

function IconThumb({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
      <Icon className="size-4 text-muted-foreground" />
    </span>
  );
}
