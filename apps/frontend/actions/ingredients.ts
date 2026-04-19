"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Ingredient } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { IngredientResponseSchema } from "@mysagra/schemas";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

export async function getIngredients(): Promise<Ingredient[]> {
  return fetchApi<Ingredient[]>(API_ENDPOINTS.INGREDIENTS.ALL, {}, z.array(IngredientResponseSchema));
}

export async function getIngredientById(id: string): Promise<Ingredient> {
  return fetchApi<Ingredient>(API_ENDPOINTS.INGREDIENTS.BY_ID(id), {}, IngredientResponseSchema);
}

export async function createIngredient(data: {
  name: string;
}): Promise<ActionResult<Ingredient>> {
  try {
    const result = await fetchApi<Ingredient>(API_ENDPOINTS.INGREDIENTS.ALL, {
      method: "POST",
      body: JSON.stringify(data),
    }, IngredientResponseSchema);
    revalidatePath("/dashboard/ingredients");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella creazione dell'ingrediente") };
  }
}

export async function updateIngredient(
  id: string,
  data: { name: string }
): Promise<ActionResult<Ingredient>> {
  try {
    const result = await fetchApi<Ingredient>(
      API_ENDPOINTS.INGREDIENTS.BY_ID(id),
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      IngredientResponseSchema
    );
    revalidatePath("/dashboard/ingredients");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'aggiornamento dell'ingrediente") };
  }
}

export async function deleteIngredient(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.INGREDIENTS.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/ingredients");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'eliminazione dell'ingrediente") };
  }
}
