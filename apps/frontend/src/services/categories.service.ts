'use server'

import { Category } from "@/types/category";
import { apiClient } from "@/lib/apiClient";

export async function getAvailableCategories() : Promise<Array<Category>> {
    return (await apiClient.get<Category[]>('v1/categories/available')).data;
}