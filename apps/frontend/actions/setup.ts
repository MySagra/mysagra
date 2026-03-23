"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, CreateApiKeyResponse } from "@/lib/api-types";
import { UserResponseSchema, RoleResponseSchema } from "@mysagra/schemas";
import { z } from "zod";

export async function setupNewAdmin(
  username: string,
  password: string,
  options: { generatePrinterKey: boolean; generateWebappKey: boolean } = {
    generatePrinterKey: true,
    generateWebappKey: true,
  }
): Promise<{
  success: boolean;
  error?: string;
  printerKey?: string;
  webappKey?: string;
}> {
  try {
    // 1. Fetch all roles to find the admin role ID
    const roles = await fetchApi<z.infer<typeof RoleResponseSchema>[]>(
      API_ENDPOINTS.ROLES.ALL,
      {},
      z.array(RoleResponseSchema)
    );

    const adminRole = roles.find((r) => r.name === "admin");
    if (!adminRole) {
      return { success: false, error: "Ruolo amministratore non trovato" };
    }

    // 2. Fetch all users to find the default admin user ID
    const users = await fetchApi<z.infer<typeof UserResponseSchema>[]>(
      API_ENDPOINTS.USERS.ALL,
      {},
      z.array(UserResponseSchema)
    );

    const defaultAdmin = users.find((u) => u.username === "admin");
    if (!defaultAdmin) {
      return {
        success: false,
        error: "Account amministratore predefinito non trovato",
      };
    }

    // 3. Create the new admin user
    await fetchApi(
      API_ENDPOINTS.USERS.ALL,
      {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          roleId: adminRole.id,
        }),
      },
      UserResponseSchema
    );

    // 4. Delete the default admin user
    await fetchApi(API_ENDPOINTS.USERS.BY_ID(defaultAdmin.id), {
      method: "DELETE",
    });

    // 5. Optionally generate initial API keys
    const [printerKeyResult, webappKeyResult] = await Promise.all([
      options.generatePrinterKey
        ? fetchApi<CreateApiKeyResponse>(API_ENDPOINTS.API_KEYS.ALL, {
            method: "POST",
            body: JSON.stringify({ name: "Servizio Stampanti", type: "PRINTER" }),
          })
        : Promise.resolve(null),
      options.generateWebappKey
        ? fetchApi<CreateApiKeyResponse>(API_ENDPOINTS.API_KEYS.ALL, {
            method: "POST",
            body: JSON.stringify({ name: "Webapp Clienti", type: "WEBAPP" }),
          })
        : Promise.resolve(null),
    ]);

    return {
      success: true,
      printerKey: printerKeyResult?.apiKey,
      webappKey: webappKeyResult?.apiKey,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore sconosciuto";
    return { success: false, error: message };
  }
}
