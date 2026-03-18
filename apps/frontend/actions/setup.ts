"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-types";
import { UserResponseSchema, RoleResponseSchema } from "@mysagra/schemas";
import { z } from "zod";

export async function setupNewAdmin(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
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

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore sconosciuto";
    return { success: false, error: message };
  }
}
