'use client'

import { 
    getFoods,
    getFoodsAvailable, 
    createFood, 
    updateFood, 
    setFoodAvailable, 
    deleteFood 
} from "@/services/foods.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Food } from "@/types/food";
import { FoodFormValues } from "@/schemas/foodForm";

// Query to get all foods
export function useFoods() {
    return useQuery({
        queryKey: ["foods"],
        queryFn: getFoods
    });
}

// Query to get available foods by category
export function useFoodsByCategory(categoryId: string) {
    return useQuery({
        queryKey: ["categoryFoods", categoryId],
        queryFn: () => getFoodsAvailable(categoryId),
        enabled: !!categoryId,
        staleTime: 1000 * 60 * 5
    });
}

// Mutation to create a new food
export function useCreateFood() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (foodData: FoodFormValues) => createFood(foodData),
        onSuccess: (newFood) => {
            // Optimistically update the cache
            queryClient.setQueryData<Food[]>(["foods"], (old) => {
                if (!old) return [newFood];
                return [...old, newFood];
            });
        },
        onError: () => {
            // In case of error, invalidate cache to reload data
            queryClient.invalidateQueries({ queryKey: ["foods"] });
        }
    });
}

// Mutation to update an existing food
export function useUpdateFood() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ foodId, foodData }: { foodId: number; foodData: FoodFormValues }) => 
            updateFood(foodId, foodData),
        onSuccess: (updatedFood) => {
            // Optimistically update the cache
            queryClient.setQueryData<Food[]>(["foods"], (old) => {
                if (!old) return [updatedFood];
                return old.map(f => f.id === updatedFood.id ? { ...f, ...updatedFood } : f);
            });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["foods"] });
        }
    });
}

// Mutation to toggle food availability
export function useToggleFoodAvailability() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (foodId: number) => setFoodAvailable(foodId),
        onSuccess: (_, foodId) => {
            // Optimistically update the cache
            queryClient.setQueryData<Food[]>(["foods"], (old) => {
                if (!old) return old;
                return old.map(f => 
                    f.id === foodId ? { ...f, available: !f.available } : f
                );
            });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["foods"] });
        }
    });
}

// Mutation to delete a food
export function useDeleteFood() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (foodId: number) => deleteFood(foodId),
        onSuccess: (_, foodId) => {
            // Optimistically remove from cache
            queryClient.setQueryData<Food[]>(["foods"], (old) => {
                if (!old) return old;
                return old.filter(f => f.id !== foodId);
            });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["foods"] });
        }
    });
}
