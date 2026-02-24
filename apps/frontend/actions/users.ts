"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, User, UserRequest, Role } from "@/lib/api-types";
import { revalidatePath } from "next/cache";

export async function getUsers(): Promise<User[]> {
  return fetchApi<User[]>(API_ENDPOINTS.USERS.ALL);
}

export async function getUserById(id: string): Promise<User> {
  return fetchApi<User>(API_ENDPOINTS.USERS.BY_ID(id));
}

export async function createUser(data: UserRequest): Promise<User> {
  const result = await fetchApi<User>(API_ENDPOINTS.USERS.ALL, {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/dashboard/users");
  return result;
}

export async function updateUser(
  id: string,
  data: UserRequest
): Promise<User> {
  const result = await fetchApi<User>(API_ENDPOINTS.USERS.BY_ID(id), {
    method: "PUT",
    body: JSON.stringify(data),
  });
  revalidatePath("/dashboard/users");
  return result;
}

export async function deleteUser(id: string): Promise<void> {
  await fetchApi(API_ENDPOINTS.USERS.BY_ID(id), {
    method: "DELETE",
  });
  revalidatePath("/dashboard/users");
}

export async function getRoles(): Promise<Role[]> {
  return fetchApi<Role[]>(API_ENDPOINTS.ROLES.ALL);
}
