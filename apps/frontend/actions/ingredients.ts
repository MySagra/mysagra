"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Ingredient } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { IngredientResponseSchema } from "@mysagra/schemas";

export async function getIngredients(): Promise<Ingredient[]> {
  return fetchApi<Ingredient[]>(API_ENDPOINTS.INGREDIENTS.ALL, {}, z.array(IngredientResponseSchema));
}

export async function getIngredientById(id: string): Promise<Ingredient> {
  return fetchApi<Ingredient>(API_ENDPOINTS.INGREDIENTS.BY_ID(id), {}, IngredientResponseSchema);
}

export async function createIngredient(data: {
  name: string;
}): Promise<Ingredient> {
  const result = await fetchApi<Ingredient>(API_ENDPOINTS.INGREDIENTS.ALL, {
    method: "POST",
    body: JSON.stringify(data),
  }, IngredientResponseSchema);
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
    },
    IngredientResponseSchema
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
