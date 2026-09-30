import { MenuContent, type MenuTab } from "@/components/dashboard/menu/menu-content";
import { getFoods } from "@/actions/foods";
import { getCategories } from "@/actions/categories";
import { getIngredients } from "@/actions/ingredients";
import { getPrinters } from "@/actions/printers";
import { getStations } from "@/actions/stations";
import { Food, Category, Ingredient, Printer, Station } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

async function safe<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return [];
  }
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab: MenuTab = tab === "extras" ? "extras" : "dishes";

  const [foods, categories, ingredients, printers, stations]: [
    Food[],
    Category[],
    Ingredient[],
    Printer[],
    Station[],
  ] = await Promise.all([
    safe(getFoods({ include: "ingredients" })),
    safe(getCategories()),
    safe(getIngredients()),
    safe(getPrinters()),
    safe(getStations()),
  ]);

  return (
    <MenuContent
      initialTab={initialTab}
      initialFoods={foods}
      initialCategories={categories}
      initialIngredients={ingredients}
      printers={printers}
      stations={stations}
    />
  );
}
