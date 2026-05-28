import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SettingsContent } from "@/components/dashboard/settings/settings-content";
import { auth } from "@/lib/auth";
import { getSessions } from "@/actions/auth";
import { getUserById } from "@/actions/users";
import { Session } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const cookieStore = await cookies();
  const currentSessionId = cookieStore.get("mysagra_session")?.value ?? "";

  let sessions: Session[] = [];
  let currentRoleId = "";

  try {
    const [sessionsData, user] = await Promise.all([
      getSessions(),
      getUserById(userId),
    ]);
    sessions = sessionsData;
    currentRoleId = user.roleId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
  }

  return (
    <>
      <DashboardHeader title="Impostazioni" />
      <SettingsContent
        userId={userId}
        currentUsername={session?.user?.name ?? ""}
        currentRoleId={currentRoleId}
        initialSessions={sessions}
        currentSessionId={currentSessionId}
      />
    </>
  );
}
