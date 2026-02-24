"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Ingredient } from "@/lib/api-types";
import { revalidatePath } from "next/cache";

export async function getIngredients(): Promise<Ingredient[]> {
  return fetchApi<Ingredient[]>(API_ENDPOINTS.INGREDIENTS.ALL);
}

export async function getIngredientById(id: string): Promise<Ingredient> {
  return fetchApi<Ingredient>(API_ENDPOINTS.INGREDIENTS.BY_ID(id));
}

export async function createIngredient(data: {
  name: string;
}): Promise<Ingredient> {
  const result = await fetchApi<Ingredient>(API_ENDPOINTS.INGREDIENTS.ALL, {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/dashboard/ingredients");
  return result;
}

export async function updateIngredient(
  id: string,
  data: { name: string }
): Promise<Ingredient> {
  const result = await fetchApi<Ingredient>(
    API_ENDPOINTS.INGREDIENTS.BY_ID(id),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  revalidatePath("/dashboard/ingredients");
  return result;
}

export async function deleteIngredient(id: string): Promise<void> {
  await fetchApi(API_ENDPOINTS.INGREDIENTS.BY_ID(id), {
    method: "DELETE",
  });
  revalidatePath("/dashboard/ingredients");
}
