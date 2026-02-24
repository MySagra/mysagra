import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { IngredientsContent } from "@/components/dashboard/ingredients/ingredients-content";
import { getIngredients } from "@/actions/ingredients";
import { Ingredient } from "@/lib/api-types";

export default async function IngredientsPage() {
  let ingredients: Ingredient[] = [];
  try {
    ingredients = await getIngredients();
  } catch (error) {
    ingredients = [];
  }

  return (
    <>
      <DashboardHeader title="Ingredienti" />
      <IngredientsContent initialIngredients={ingredients} />
    </>
  );
}
