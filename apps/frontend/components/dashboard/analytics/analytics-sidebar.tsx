"use client";

import { useState, useMemo } from "react";
import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, UtensilsCrossed, Filter, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryItem {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
}

interface FoodItem {
  id: string;
  name: string;
  categoryName: string;
  categoryId?: string;
  revenue: number;
  quantity: number;
}

export type FilterSelection = {
  type: "food" | "category";
  id: string;
  name: string;
} | null;

interface AnalyticsSidebarProps {
  categories: CategoryItem[];
  topFoods: FoodItem[];
  topFoodsByRevenue: FoodItem[];
  selection: FilterSelection;
  onSelectionChange: (selection: FilterSelection) => void;
}

const CATEGORY_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(217, 91%, 60%)",
  "hsl(43, 74%, 66%)",
  "hsl(340, 82%, 52%)",
  "hsl(262, 83%, 58%)",
  "hsl(27, 87%, 67%)",
  "hsl(173, 58%, 39%)",
  "hsl(12, 76%, 61%)",
  "hsl(197, 37%, 24%)",
  "hsl(47, 100%, 50%)",
];

const FOOD_COLORS = [
  "hsl(12, 76%, 61%)",
  "hsl(173, 58%, 39%)",
  "hsl(197, 37%, 24%)",
  "hsl(43, 74%, 66%)",
  "hsl(27, 87%, 67%)",
  "hsl(340, 82%, 52%)",
  "hsl(262, 83%, 58%)",
  "hsl(142, 76%, 36%)",
  "hsl(217, 91%, 60%)",
  "hsl(47, 100%, 50%)",
];

const MAX_VISIBLE_CATEGORIES = 5;
const MAX_VISIBLE_FOODS = 4;

export function AnalyticsSidebar({
  categories,
  topFoods,
  topFoodsByRevenue,
  selection,
  onSelectionChange,
}: AnalyticsSidebarProps) {
  const { t } = useLocale();
  const [foodViewMode, setFoodViewMode] = useState<"quantity" | "revenue">("quantity");
  const [categorySearch, setCategorySearch] = useState("");
  const [foodSearch, setFoodSearch] = useState("");

  const totalRevenue = categories.reduce((sum, c) => sum + c.revenue, 0);
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(val);

  // Filter categories by search, then limit to 5 unless searching
  const displayedCategories = useMemo(() => {
    const query = categorySearch.toLowerCase().trim();
    if (query) {
      return categories.filter((c) => c.name.toLowerCase().includes(query));
    }
    return categories.slice(0, MAX_VISIBLE_CATEGORIES);
  }, [categories, categorySearch]);

  // Filter foods: first by selected category, then by search, then limit to 5
  const filteredFoodItems = useMemo(() => {
    const baseItems = foodViewMode === "quantity" ? topFoods : topFoodsByRevenue;
    let items = baseItems;

    // Filter by selected category
    if (selection?.type === "category") {
      const filtered = items.filter(
        (food) => food.categoryName === selection.name || food.categoryId === selection.id
      );
      if (filtered.length > 0) items = filtered;
    }

    // Filter by search
    const query = foodSearch.toLowerCase().trim();
    if (query) {
      return items.filter((f) => f.name.toLowerCase().includes(query));
    }

    return items.slice(0, MAX_VISIBLE_FOODS);
  }, [foodViewMode, topFoods, topFoodsByRevenue, selection, foodSearch]);

  const handleCategoryClick = (cat: CategoryItem) => {
    if (selection?.type === "category" && selection.id === cat.id) {
      onSelectionChange(null);
    } else {
      onSelectionChange({ type: "category", id: cat.id, name: cat.name });
    }
  };

  const handleFoodClick = (food: FoodItem) => {
    if (selection?.type === "food" && selection.id === food.id) {
      onSelectionChange(null);
    } else {
      onSelectionChange({ type: "food", id: food.id, name: food.name });
    }
  };

  return (
    <Card className="overflow-hidden border-border/60 h-full">
      {/* Active filter area — always visible, compact */}
      <div className="px-3 pt-2 pb-1.5">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all duration-200 min-h-[32px]",
            selection
              ? "bg-amber-500/10 border border-amber-500/30"
              : "bg-muted/30 border border-transparent"
          )}
        >
          <Filter className={cn("h-3.5 w-3.5 shrink-0", selection ? "text-amber-500" : "text-muted-foreground/50")} />
          {selection ? (
            <>
              <span className="text-xs text-muted-foreground">{t.analytics.activeFilter}:</span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate">
                {selection.name}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded shrink-0">
                {selection.type === "category" ? t.analytics.drillDownCategory : t.analytics.drillDownFood}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive ml-auto shrink-0"
                onClick={() => onSelectionChange(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground/50 italic">{t.analytics.allData}</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 border-b border-border/40" />

      {/* Categories section */}
      <CardContent className="px-3 pb-1.5 pt-2">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="rounded-md bg-violet-500/10 p-1">
            <LayoutGrid className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t.analytics.sidebarCategories}
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto">{categories.length}</span>
        </div>
        {/* Search bar */}
        <div className="relative mb-2 px-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
          <Input
            placeholder={t.categories.searchPlaceholder}
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            className="h-7 text-xs pl-7 pr-2 bg-muted/30 border-border/30"
          />
        </div>
        <div className="space-y-0.5 max-h-[200px] overflow-y-auto pr-1">
          {displayedCategories.map((cat, i) => {
            const pct = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
            const isSelected = selection?.type === "category" && selection.id === cat.id;
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                title={t.analytics.clickToFilter}
                className={cn(
                  "relative flex items-center w-full rounded-lg px-3 py-2 text-left transition-all duration-200 group",
                  "hover:bg-accent/60",
                  isSelected
                    ? "bg-primary/10 ring-1 ring-primary/40 shadow-sm"
                    : "hover:shadow-sm"
                )}
              >
                <div
                  className="absolute inset-0 rounded-lg opacity-[0.07] transition-opacity group-hover:opacity-[0.12]"
                  style={{
                    background: `linear-gradient(90deg, ${color} ${pct}%, transparent ${pct}%)`,
                  }}
                />

                <div className="relative flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-sm shrink-0 transition-transform",
                        isSelected && "scale-125"
                      )}
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className={cn(
                        "text-sm truncate max-w-[100px] transition-colors",
                        isSelected ? "font-semibold text-primary" : "text-foreground group-hover:text-primary"
                      )}
                    >
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] tabular-nums text-muted-foreground">{cat.quantity}x</span>
                    <span className="text-[10px] tabular-nums font-medium text-foreground">
                      {formatCurrency(cat.revenue)}
                    </span>
                    <span
                      className="text-[9px] tabular-nums font-medium rounded-full px-1.5 py-0.5"
                      style={{ backgroundColor: `${color}22`, color }}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full"
                    style={{ backgroundColor: color }}
                  />
                )}
              </button>
            );
          })}
          {displayedCategories.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">{t.analytics.noData}</p>
          )}
        </div>
      </CardContent>

      {/* Divider */}
      <div className="mx-3 border-b border-border/40" />

      {/* Foods section */}
      <CardContent className="px-3 pb-2.5 pt-2">
        <div className="flex items-center justify-between mb-2 px-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-orange-500/10 p-1">
              <UtensilsCrossed className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t.analytics.sidebarFoods}
            </span>
            {selection?.type === "category" && (
              <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                {selection.name}
              </span>
            )}
          </div>
          <div className="flex gap-0.5">
            <Button
              variant={foodViewMode === "quantity" ? "default" : "ghost"}
              size="sm"
              className="h-5 text-[9px] px-1.5 rounded-md"
              onClick={() => setFoodViewMode("quantity")}
            >
              {t.analytics.quantity}
            </Button>
            <Button
              variant={foodViewMode === "revenue" ? "default" : "ghost"}
              size="sm"
              className="h-5 text-[9px] px-1.5 rounded-md"
              onClick={() => setFoodViewMode("revenue")}
            >
              {t.analytics.revenue}
            </Button>
          </div>
        </div>
        {/* Search bar */}
        <div className="relative mb-2 px-1 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
          <Input
            placeholder={t.foods.searchPlaceholder}
            value={foodSearch}
            onChange={(e) => setFoodSearch(e.target.value)}
            className="h-7 text-xs pl-7 pr-2 bg-muted/30 border-border/30"
          />
        </div>
        <div className="space-y-0.5 max-h-[250px] overflow-y-auto pr-1">
          {filteredFoodItems.map((food, i) => {
            const isSelected = selection?.type === "food" && selection.id === food.id;
            const color = FOOD_COLORS[i % FOOD_COLORS.length];
            const maxVal = filteredFoodItems[0]
              ? foodViewMode === "quantity"
                ? filteredFoodItems[0].quantity
                : filteredFoodItems[0].revenue
              : 1;
            const currentVal = foodViewMode === "quantity" ? food.quantity : food.revenue;
            const barPct = maxVal > 0 ? (currentVal / maxVal) * 100 : 0;

            return (
              <button
                key={food.id}
                onClick={() => handleFoodClick(food)}
                title={t.analytics.clickToFilter}
                className={cn(
                  "relative flex items-center w-full rounded-lg px-3 py-2 text-left transition-all duration-200 group",
                  "hover:bg-accent/60",
                  isSelected
                    ? "bg-primary/10 ring-1 ring-primary/40 shadow-sm"
                    : "hover:shadow-sm"
                )}
              >
                <div
                  className="absolute inset-0 rounded-lg opacity-[0.08] transition-opacity group-hover:opacity-[0.14]"
                  style={{
                    background: `linear-gradient(90deg, ${color} ${barPct}%, transparent ${barPct}%)`,
                  }}
                />

                <div className="relative flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {foodSearch.trim() ? (
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center rounded-md h-5 w-5 shrink-0 text-[10px] font-bold"
                        style={{ backgroundColor: `${color}25`, color }}
                      >
                        {i + 1}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span
                        className={cn(
                          "text-sm truncate block max-w-[100px] transition-colors",
                          isSelected ? "font-semibold text-primary" : "text-foreground group-hover:text-primary"
                        )}
                      >
                        {food.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate block max-w-[100px]">
                        {food.categoryName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] tabular-nums text-muted-foreground">{food.quantity}x</span>
                    <span className="text-[10px] tabular-nums font-medium text-foreground">
                      {formatCurrency(food.revenue)}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full"
                    style={{ backgroundColor: color }}
                  />
                )}
              </button>
            );
          })}
          {filteredFoodItems.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">{t.analytics.noData}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
