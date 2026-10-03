import { redirect } from "next/navigation";

// API keys now live in the settings page
export default function ApiKeysPage() {
  redirect("/dashboard/settings?tab=api-keys");
}
