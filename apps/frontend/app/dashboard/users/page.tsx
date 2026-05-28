import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { UsersContent } from "@/components/dashboard/users/users-content";
import { getUsers, getRoles } from "@/actions/users";
import { User, Role } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { auth } from "@/lib/auth";

export default async function UsersPage() {
  const session = await auth();
  const currentUserId = session?.user?.id ?? "";

  let users: User[] = [];
  let roles: Role[] = [];

  try {
    [users, roles] = await Promise.all([getUsers(), getRoles()]);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    users = [];
    roles = [];
  }

  return (
    <>
      <DashboardHeader title="Utenti" />
      <UsersContent initialUsers={users} roles={roles} currentUserId={currentUserId} />
    </>
  );
}
