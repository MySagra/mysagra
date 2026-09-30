import { Category, Food } from "@/lib/api-types";

/** Replace `{key}` placeholders in a translation string. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match
  );
}

const priceFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(value: number | string): string {
  return priceFormatter.format(Number(value));
}

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.position - b.position);
}

/**
 * Il backend applica `available` e `printerId` della categoria a tutti i suoi
 * piatti a ogni PUT/PATCH della categoria: replica lo stesso effetto in locale.
 */
export function applyCategoryToFoods(foods: Food[], category: Category): Food[] {
  return foods.map((f) =>
    f.categoryId === category.id
      ? { ...f, available: category.available, printerId: category.printerId ?? null }
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
