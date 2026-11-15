import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CategoriesContent } from "@/components/dashboard/categories/categories-content";
import { getCategories } from "@/actions/categories";
import { getFoods } from "@/actions/foods";
import { getPrinters } from "@/actions/printers";
import { getStations } from "@/actions/stations";
import { Category, Food, Printer, Station } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function CategoriesPage() {
  let categories: Category[] = [];
  let foods: Food[] = [];
  let printers: Printer[] = [];
  let stations: Station[] = [];

  try {
    categories = await getCategories();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    categories = [];
  }

  // the separate ticket flag lives on the foods: the table shows it per category from these
  try {
    foods = await getFoods();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    foods = [];
  }

  try {
    printers = await getPrinters();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    printers = [];
  }

  try {
    stations = await getStations();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    stations = [];
  }

  return (
    <>
      <DashboardHeader navKey="categories" />
      <CategoriesContent initialCategories={categories} initialFoods={foods} printers={printers} stations={stations} />
    </>
  );
}
