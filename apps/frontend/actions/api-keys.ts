"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, ApiKey, CreateApiKeyRequest, CreateApiKeyResponse } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiKeyBaseResponseSchema, CreateApiKeyResponseSchema } from "@mysagra/schemas";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

export async function getApiKeys(): Promise<ApiKey[]> {
  return fetchApi<ApiKey[]>(API_ENDPOINTS.API_KEYS.ALL, {}, z.array(ApiKeyBaseResponseSchema) as any);
}

export async function createApiKey(data: CreateApiKeyRequest): Promise<ActionResult<CreateApiKeyResponse>> {
  try {
    const result = await fetchApi<CreateApiKeyResponse>(
      API_ENDPOINTS.API_KEYS.ALL,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      CreateApiKeyResponseSchema as any
    );
    revalidatePath("/dashboard/api-keys");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella creazione dell'API Key") };
  }
}

export async function revokeApiKey(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.API_KEYS.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/api-keys");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella revoca dell'API Key") };
  }
}
