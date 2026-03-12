import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { IngredientsContent } from "@/components/dashboard/ingredients/ingredients-content";
import { getIngredients } from "@/actions/ingredients";
import { Ingredient } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function IngredientsPage() {
  let ingredients: Ingredient[] = [];
  try {
    ingredients = await getIngredients();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    ingredients = [];
  }

  return (
    <>
      <DashboardHeader title="Ingredienti" />
      <IngredientsContent initialIngredients={ingredients} />
    </>
  );
}
