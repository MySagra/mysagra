"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, User, UserRequest, Role } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UserResponseSchema, RoleResponseSchema } from "@mysagra/schemas";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

export async function getUsers(): Promise<User[]> {
  return fetchApi<User[]>(API_ENDPOINTS.USERS.ALL, {}, z.array(UserResponseSchema));
}

export async function getUserById(id: string): Promise<User> {
  return fetchApi<User>(API_ENDPOINTS.USERS.BY_ID(id), {}, UserResponseSchema);
}

export async function createUser(data: UserRequest): Promise<ActionResult<User>> {
  try {
    const result = await fetchApi<User>(API_ENDPOINTS.USERS.ALL, {
      method: "POST",
      body: JSON.stringify(data),
    }, UserResponseSchema);
    revalidatePath("/dashboard/users");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella creazione dell'utente") };
  }
}

export async function patchUserRole(id: string, roleId: string): Promise<ActionResult<User>> {
  try {
    const result = await fetchApi<User>(API_ENDPOINTS.USERS.BY_ID(id), {
      method: "PATCH",
      body: JSON.stringify({ role: roleId }),
    }, UserResponseSchema);
    revalidatePath("/dashboard/users");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'aggiornamento del ruolo") };
  }
}

export async function deleteUser(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.USERS.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/users");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'eliminazione dell'utente") };
  }
}

export async function getRoles(): Promise<Role[]> {
  return fetchApi<Role[]>(API_ENDPOINTS.ROLES.ALL, {}, z.array(RoleResponseSchema));
}
