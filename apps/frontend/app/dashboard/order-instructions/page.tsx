import { redirect } from "next/navigation";

// Legacy route: banner e istruzioni ora vivono nella pagina App clienti
export default function LegacyOrderInstructionsRoute() {
  redirect("/dashboard/customer-app?tab=instructions");
}
