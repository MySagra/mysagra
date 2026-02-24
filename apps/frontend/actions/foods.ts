"use server";

import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Food, FoodRequest } from "@/lib/api-types";
import { revalidatePath } from "next/cache";

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
  return fetchApi<Food[]>(endpoint);
}

export async function getFoodById(
  id: string,
  include?: string
): Promise<Food> {
  const query = include ? `?include=${include}` : "";
  return fetchApi<Food>(`${API_ENDPOINTS.FOODS.BY_ID(id)}${query}`);
}

export async function createFood(data: FoodRequest): Promise<Food> {
  const result = await fetchApi<Food>(API_ENDPOINTS.FOODS.ALL, {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/dashboard/foods");
  return result;
}

export async function updateFood(id: string, data: FoodRequest): Promise<Food> {
  const result = await fetchApi<Food>(API_ENDPOINTS.FOODS.BY_ID(id), {
    method: "PUT",
    body: JSON.stringify(data),
  });
  revalidatePath("/dashboard/foods");
  return result;
}

export async function toggleFoodAvailability(
  id: string,
  available: boolean
): Promise<Food> {
  const result = await fetchApi<Food>(API_ENDPOINTS.FOODS.BY_ID(id), {
    method: "PATCH",
    body: JSON.stringify({ available }),
  });
  revalidatePath("/dashboard/foods");
  return result;
}

export async function deleteFood(id: string): Promise<void> {
  await fetchApi(API_ENDPOINTS.FOODS.BY_ID(id), {
    method: "DELETE",
  });
  revalidatePath("/dashboard/foods");
}
