import { redirect } from "next/navigation";

// Legacy route: categorie, piatti e aggiunte ora vivono nella pagina Menù
export default function LegacyMenuRoute() {
  redirect("/dashboard/menu");
}
