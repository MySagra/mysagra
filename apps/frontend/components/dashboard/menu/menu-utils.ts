import { Category, Food } from "@/lib/api-types";

/** Replace `{key}` placeholders in a translation string. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match
  );
}

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.position - b.position);
}

/**
 * Il backend applica `available` e `printerId` della categoria ai suoi piatti
 * solo quando cambiano: replica lo stesso effetto in locale.
 */
export function applyCategoryToFoods(foods: Food[], previous: Category, category: Category): Food[] {
  const availableChanged = previous.available !== category.available;
  const printerChanged = (previous.printerId ?? null) !== (category.printerId ?? null);
  if (!availableChanged && !printerChanged) return foods;

  return foods.map((f) =>
    f.categoryId === category.id
      ? {
          ...f,
          ...(availableChanged && { available: category.available }),
          ...(printerChanged && { printerId: category.printerId ?? null }),
        }
      : f
  );
}

export function matchesQuery(text: string | null | undefined, query: string): boolean {
  if (!text) return false;
  return normalize(text).includes(normalize(query));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}
