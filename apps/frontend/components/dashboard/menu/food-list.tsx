"use client";

import type { ReactNode } from "react";
import { PlusIcon } from "lucide-react";
import { Category, Food } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";
import { AvailabilityChip } from "./availability-control";
import { fill, formatPrice } from "./menu-utils";

/** Stile condiviso delle righe selezionabili (piatti e ingredienti) */
export function listRowClassName(selected: boolean) {
  return cn(
    "flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors outline-none first:rounded-t-[calc(var(--radius-xl)-1px)] last:rounded-b-[calc(var(--radius-xl)-1px)] hover:bg-muted/50 focus-visible:bg-muted/60 sm:px-4",
    selected && "bg-primary/10 ring-1 ring-primary/60 ring-inset hover:bg-primary/15"
  );
}

export interface FoodGroup {
  category: Category;
  foods: Food[];
}

interface FoodListProps {
  groups: FoodGroup[];
  selectedFoodId: string | null;
  pendingIds: Set<string>;
  canEdit: boolean;
  /** Class applied to group headers (e.g. to hide them on wide screens) */
  groupHeaderClassName?: string;
  renderGroupActions?: (category: Category) => ReactNode;
  onSelect: (food: Food) => void;
  onToggle: (food: Food) => void;
  onAddDish: (categoryId: string) => void;
}

export function FoodList({
  groups,
  selectedFoodId,
  pendingIds,
  canEdit,
  groupHeaderClassName,
  renderGroupActions,
  onSelect,
  onToggle,
  onAddDish,
}: FoodListProps) {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      {groups.map(({ category, foods }) => (
        <section key={category.id} aria-label={category.name} className="space-y-2">
          <header className={cn("flex items-center gap-2", groupHeaderClassName)}>
            <h3 className="min-w-0 truncate text-base font-semibold">{category.name}</h3>
            <span className="shrink-0 text-sm text-muted-foreground">
              · {foods.length === 1 ? t.menu.dishCountOne : fill(t.menu.dishCountMany, { n: foods.length })}
            </span>
            {!category.available && (
              <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                {t.menu.categoryUnavailable}
              </span>
            )}
            <div className="ml-auto shrink-0">{renderGroupActions?.(category)}</div>
          </header>

          {foods.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                {fill(t.menu.emptyCategory, { name: category.name })}
              </p>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => onAddDish(category.id)}>
                  <PlusIcon />
                  {t.menu.addFirstDish}
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {foods.map((food) => (
                <FoodRow
                  key={food.id}
                  food={food}
                  selected={food.id === selectedFoodId}
                  pending={pendingIds.has(food.id)}
                  canEdit={canEdit}
                  onSelect={onSelect}
                  onToggle={onToggle}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function FoodRow({
  food,
  selected,
  pending,
  canEdit,
  onSelect,
  onToggle,
}: {
  food: Food;
  selected: boolean;
  pending: boolean;
  canEdit: boolean;
  onSelect: (food: Food) => void;
  onToggle: (food: Food) => void;
}) {
  const { t } = useLocale();
  const extras = food.ingredients?.length ?? 0;
  const extrasLabel =
    extras === 0
      ? t.menu.noExtras
      : extras === 1
        ? t.menu.extrasCountOne
        : fill(t.menu.extrasCountMany, { n: extras });

  return (
    <li
      role="button"
      tabIndex={0}
      aria-current={selected || undefined}
      onClick={() => onSelect(food)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(food);
        }
      }}
      className={listRowClassName(selected)}
    >
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-medium",
            !food.available && "text-muted-foreground"
          )}
        >
          {food.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          <span className="tabular-nums">{formatPrice(food.price)}</span>
          {" · "}
          {extrasLabel}
          {food.description && (
            <span className="hidden md:inline"> · {food.description}</span>
          )}
        </p>
      </div>
      <AvailabilityChip
        available={food.available}
        pending={pending}
        onToggle={canEdit ? () => onToggle(food) : undefined}
      />
    </li>
  );
}
