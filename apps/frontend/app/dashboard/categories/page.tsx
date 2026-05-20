import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CategoriesContent } from "@/components/dashboard/categories/categories-content";
import { getCategories } from "@/actions/categories";
import { getPrinters } from "@/actions/printers";
import { getStations } from "@/actions/stations";
import { Category, Printer, Station } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function CategoriesPage() {
  let categories: Category[] = [];
  let printers: Printer[] = [];
  let stations: Station[] = [];

  try {
    categories = await getCategories();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    categories = [];
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
      <DashboardHeader title="Categorie" />
      <CategoriesContent initialCategories={categories} printers={printers} stations={stations} />
    </>
  );
}
