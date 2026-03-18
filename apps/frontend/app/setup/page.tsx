import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SetupWizard } from "@/components/setup/setup-wizard";

export default async function SetupPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user?.name !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SetupWizard />
    </div>
  );
}
