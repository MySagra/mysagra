"use client";

import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { Food, Ingredient } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/contexts/locale-context";
import { listRowClassName } from "./food-list";
import { fill, formatPrice, matchesQuery } from "./menu-utils";

interface ExtrasTabProps {
  ingredients: Ingredient[];
  foods: Food[];
  selectedId: string | null;
  canEdit: boolean;
  onCreate: () => void;
  onSelect: (ingredient: Ingredient) => void;
}

/** Lista ingredienti: stessa struttura della lista piatti (ricerca, riepilogo, righe). */
export function ExtrasTab({
  ingredients,
  foods,
  selectedId,
  canEdit,
  onCreate,
  onSelect,
}: ExtrasTabProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");

  const usage = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const food of foods) {
      for (const ingredient of food.ingredients ?? []) {
        map.set(ingredient.id, [...(map.get(ingredient.id) ?? []), food.name]);
      }
    }
    return map;
  }, [foods]);

  const query = search.trim();
  const visible = [...ingredients]
    .filter((i) => !query || matchesQuery(i.name, query))
    .sort((a, b) => a.name.localeCompare(b.name));
  const unused = ingredients.filter((i) => !usage.has(i.id)).length;

  return (
    <section className="flex min-w-0 flex-col gap-4 lg:min-h-0">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.menu.searchExtras}
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

      <p className="text-xs text-muted-foreground">
        {fill(t.menu.ingredientsSummary, { total: ingredients.length, unused })}
      </p>

      <div className="lg:-mx-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-1 lg:pb-4">
        {ingredients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
            <p className="font-medium">{t.menu.emptyExtrasTitle}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t.menu.emptyExtrasDescription}</p>
            {canEdit && (
              <Button onClick={onCreate}>
                <PlusIcon />
                {t.menu.newExtra}
              </Button>
            )}
          </div>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t.menu.noExtrasFound}</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {visible.map((ingredient) => {
              const usedBy = usage.get(ingredient.id) ?? [];
              const usageLabel =
                usedBy.length === 0
                  ? t.menu.notUsed
                  : usedBy.length === 1
                    ? t.menu.usedInOne
                    : fill(t.menu.usedInMany, { n: usedBy.length });
              const surcharge = Number(ingredient.surcharge);
              const selected = ingredient.id === selectedId;
              return (
                <li
                  key={ingredient.id}
                  role="button"
                  tabIndex={0}
                  aria-current={selected || undefined}
                  onClick={() => onSelect(ingredient)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(ingredient);
                    }
                  }}
                  className={listRowClassName(selected)}
                >
                  <div className="min-w-0 flex-1">
                    <p className={usedBy.length === 0 ? "truncate font-medium text-muted-foreground" : "truncate font-medium"}>
                      {ingredient.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {usageLabel}
                      {usedBy.length > 0 && (
                        <span className="hidden md:inline"> · {usedBy.join(", ")}</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={
                      surcharge > 0
                        ? "inline-flex h-7 shrink-0 items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 text-xs font-medium text-primary-foreground tabular-nums dark:text-primary"
                        : "inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-xs text-muted-foreground"
                    }
                  >
                    {surcharge > 0 ? `+ ${formatPrice(surcharge)}` : t.menu.free}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
