import { redirect } from "next/navigation";

// Users now live in the settings page
export default function UsersPage() {
  redirect("/dashboard/settings?tab=users");
}
