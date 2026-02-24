import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CategoriesContent } from "@/components/dashboard/categories/categories-content";
import { getCategories } from "@/actions/categories";
import { getPrinters } from "@/actions/printers";
import { Category, Printer } from "@/lib/api-types";

export default async function CategoriesPage() {
  let categories: Category[] = [];
  let printers: Printer[] = [];

  try {
    categories = await getCategories();
  } catch (error) {
    categories = [];
  }

  try {
    printers = await getPrinters();
  } catch (error) {
    printers = []; // Default to empty if fetch fails
  }

  return (
    <>
      <DashboardHeader title="Categorie" />
      <CategoriesContent initialCategories={categories} printers={printers} />
    </>
  );
}
