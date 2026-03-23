"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, ApiKey, CreateApiKeyRequest, CreateApiKeyResponse } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiKeyBaseResponseSchema, CreateApiKeyResponseSchema } from "@mysagra/schemas";

export async function getApiKeys(): Promise<ApiKey[]> {
  return fetchApi<ApiKey[]>(API_ENDPOINTS.API_KEYS.ALL, {}, z.array(ApiKeyBaseResponseSchema) as any);
}

export async function createApiKey(data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
  const result = await fetchApi<CreateApiKeyResponse>(
    API_ENDPOINTS.API_KEYS.ALL,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    CreateApiKeyResponseSchema as any
  );
  revalidatePath("/dashboard/api-keys");
  return result;
}

export async function revokeApiKey(id: string): Promise<void> {
  await fetchApi(API_ENDPOINTS.API_KEYS.BY_ID(id), {
    method: "DELETE",
  });
  revalidatePath("/dashboard/api-keys");
}
