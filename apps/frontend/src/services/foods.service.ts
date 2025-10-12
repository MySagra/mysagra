'use server'

import { Food } from "@/types/food";
import { apiClient } from "@/lib/apiClient";

export async function getFoods(): Promise<Array<Food>> {
    return (await apiClient.get<Food[]>(`v1/foods`)).data;
}

export async function getFoodsAvailable(categoryId: string): Promise<Array<Food>> {
    return (await apiClient.get<Food[]>(`v1/foods/available/categories/${categoryId}`)).data;
}