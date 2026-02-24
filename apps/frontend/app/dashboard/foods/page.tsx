import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FoodsContent } from "@/components/dashboard/foods/foods-content";
import { getFoods } from "@/actions/foods";
import { getCategories } from "@/actions/categories";
import { getIngredients } from "@/actions/ingredients";
import { getPrinters } from "@/actions/printers";
import { Food, Category, Ingredient, Printer } from "@/lib/api-types";

export default async function FoodsPage() {
  let foods: Food[] = [];
  let categories: Category[] = [];
  let ingredients: Ingredient[] = [];
  let printers: Printer[] = [];

  try {
    [foods, categories, ingredients, printers] = await Promise.all([
      getFoods({ include: "ingredients" }),
      getCategories(),
      getIngredients(),
      getPrinters(),
    ]);
  } catch (error) {
    foods = [];
    categories = [];
    ingredients = [];
    printers = [];
  }

  return (
    <>
      <DashboardHeader title="Cibi" />
      <FoodsContent initialFoods={foods} categories={categories} ingredients={ingredients} printers={printers} />
    </>
  );
}
