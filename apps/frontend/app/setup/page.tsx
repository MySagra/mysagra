import { redirect } from "next/navigation";
import { SettingsDataSchema } from "@mysagra/schemas";
import { getSetupStatus } from "@/actions/setup";
import { SetupWizard } from "@/components/setup/setup-wizard";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // the setup is public but usable only on a new instance
  if (!(await getSetupStatus())) {
    redirect("/login");
  }

  // defaults come from the shared schema, so the wizard starts from the same values the backend applies
  return <SetupWizard defaultSettings={SettingsDataSchema.parse({})} />;
}
