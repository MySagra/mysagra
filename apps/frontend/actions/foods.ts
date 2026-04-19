"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Food, FoodRequest } from "@/lib/api-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FoodResponseSchema } from "@mysagra/schemas";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";

// Cast to ZodType<Food> since schema allows null for ingredients but interface uses undefined
const FoodSchema = FoodResponseSchema as z.ZodType<Food>;
const FoodsArraySchema = z.array(FoodResponseSchema) as z.ZodType<Food[]>;

export async function getFoods(params?: {
  include?: string;
  available?: boolean;
  category?: string[];
}): Promise<Food[]> {
  const searchParams = new URLSearchParams();
  if (params?.include) searchParams.set("include", params.include);
  if (params?.available !== undefined)
    searchParams.set("available", String(params.available));
  if (params?.category) {
    params.category.forEach((cat) => searchParams.append("category", cat));
  }

  const query = searchParams.toString();
  const endpoint = `${API_ENDPOINTS.FOODS.ALL}${query ? `?${query}` : ""}`;
  return fetchApi<Food[]>(endpoint, {}, FoodsArraySchema);
}

export async function getFoodById(
  id: string,
  include?: string
): Promise<Food> {
  const query = include ? `?include=${include}` : "";
  return fetchApi<Food>(`${API_ENDPOINTS.FOODS.BY_ID(id)}${query}`, {}, FoodSchema);
}

export async function createFood(data: FoodRequest): Promise<ActionResult<Food>> {
  try {
    const result = await fetchApi<Food>(API_ENDPOINTS.FOODS.ALL, {
      method: "POST",
      body: JSON.stringify(data),
    }, FoodSchema);
    revalidatePath("/dashboard/foods");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella creazione della pietanza") };
  }
}

export async function updateFood(id: string, data: FoodRequest): Promise<ActionResult<Food>> {
  try {
    const result = await fetchApi<Food>(API_ENDPOINTS.FOODS.BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }, FoodSchema);
    revalidatePath("/dashboard/foods");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'aggiornamento della pietanza") };
  }
}

export async function toggleFoodAvailability(
  id: string,
  available: boolean
): Promise<Food> {
  const result = await fetchApi<Food>(API_ENDPOINTS.FOODS.BY_ID(id), {
    method: "PATCH",
    body: JSON.stringify({ available }),
  }, FoodSchema);
  revalidatePath("/dashboard/foods");
  return result;
}

export async function deleteFood(id: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.FOODS.BY_ID(id), {
      method: "DELETE",
    });
    revalidatePath("/dashboard/foods");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nell'eliminazione della pietanza") };
  }
}

export async function checkFoodNameExists(name: string, excludeId?: string): Promise<boolean> {
  try {
    const foods = await getFoods();
    return foods.some(f => f.name.toLowerCase() === name.toLowerCase() && f.id !== excludeId);
  } catch {
    return false;
  }
}
