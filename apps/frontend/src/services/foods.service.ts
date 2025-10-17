'use server'

import { Food } from "@/types/food";
import { apiClient } from "@/lib/apiClient";
import { FoodFormValues, getFoodFormSchema } from "@/schemas/foodForm";
import { getAccessToken } from "@/lib/auth/getTokens";

// Get all foods
export async function getFoods(): Promise<Array<Food>> {
    return (await apiClient.get<Food[]>('v1/foods', {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}

// Get available foods by category
export async function getFoodsAvailable(categoryId: string): Promise<Array<Food>> {
    return (await apiClient.get<Food[]>(`v1/foods/available/categories/${categoryId}`)).data;
}

// Create a new food with Zod validation
export async function createFood(foodData: FoodFormValues): Promise<Food> {
    // Validate data with Zod schema
    const schema = getFoodFormSchema((key: string) => key); // Placeholder function for messages
    const validatedData = schema.parse(foodData);
    
    return (await apiClient.post<Food>('v1/foods', validatedData, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}

// Update an existing food with Zod validation
export async function updateFood(foodId: number, foodData: FoodFormValues): Promise<Food> {
    // Validate data with Zod schema
    const schema = getFoodFormSchema((key: string) => key); // Placeholder function for messages
    const validatedData = schema.parse(foodData);
    
    return (await apiClient.put<Food>(`v1/foods/${foodId}`, validatedData, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}

// Toggle food availability
export async function setFoodAvailable(foodId: number): Promise<Food> {
    return (await apiClient.patch<Food>(`v1/foods/available/${foodId}`, {}, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}

// Delete a food
export async function deleteFood(foodId: number): Promise<Food> {
    return (await apiClient.delete(`v1/foods/${foodId}`, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}