'use server'

import { Category } from "@/types/category";
import { apiClient } from "@/lib/apiClient";
import { getAccessToken } from "@/lib/auth/getTokens";
import { CategoryFormValues, getCategoryFormSchema } from "@/schemas/categoryForm";

// Get all categories
export async function getCategories(): Promise<Array<Category>> {
    return (await apiClient.get<Category[]>('v1/categories', {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}

// Get only available categories
export async function getAvailableCategories(): Promise<Array<Category>> {
    return (await apiClient.get<Category[]>('v1/categories/available')).data;
}

// Create a new category with Zod validation
export async function createCategory(categoryData: Omit<CategoryFormValues, 'image'>) {
    // Validate data with Zod schema (without image)
    const schema = getCategoryFormSchema((key: string) => key); // Placeholder function for messages
    const validatedData = schema.parse({ ...categoryData, image: undefined });
    
    // Remove image field before sending to API
    delete validatedData.image;

    return (await apiClient.post<Category>('v1/categories', validatedData, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}

// Update an existing category with Zod validation
export async function updateCategory(categoryId: number, categoryData: Omit<CategoryFormValues, 'image'>) {
    // Validate data with Zod schema (without image)
    const schema = getCategoryFormSchema((key: string) => key); // Placeholder function for messages
    const validatedData = schema.parse({ ...categoryData, image: undefined });
    
    // Remove image field before sending to API
    delete validatedData.image;

    return (await apiClient.put<Category>(`v1/categories/${categoryId}`, validatedData, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}

// Toggle category availability
export async function setCategoryAvailable(categoryId: number) {
    return (await apiClient.patch(`v1/categories/available/${categoryId}`, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}

// Delete a category
export async function deleteCategory(categoryId: number) {
    return (await apiClient.delete(`v1/categories/${categoryId}`, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}