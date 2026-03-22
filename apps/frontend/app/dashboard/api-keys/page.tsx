import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ApiKeysContent } from "@/components/dashboard/api-keys/api-keys-content";
import { getApiKeys } from "@/actions/api-keys";
import { ApiKey } from "@/lib/api-types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function ApiKeysPage() {
  let apiKeys: ApiKey[] = [];
  try {
    apiKeys = await getApiKeys();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    apiKeys = [];
  }

  return (
    <>
      <DashboardHeader title="API Keys" />
      <ApiKeysContent initialApiKeys={apiKeys} />
    </>
  );
}
