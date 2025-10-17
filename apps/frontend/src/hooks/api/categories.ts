'use client'

import { 
    getCategories, 
    getAvailableCategories,
    createCategory,
    updateCategory,
    setCategoryAvailable,
    deleteCategory
} from "@/services/categories.service";
import { setCategoryImage } from "@/services/categories-client.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Category } from "@/types/category";
import { CategoryFormValues } from "@/schemas/categoryForm";

// Query to get all categories
export function useCategories() {
    return useQuery({
        queryKey: ["categories"],
        queryFn: getCategories
    });
}

// Query to get only available categories
export function useAvailableCategories() {
    return useQuery({
        queryKey: ["categories", "available"],
        queryFn: getAvailableCategories
    });
}

// Mutation to create a new category
export function useCreateCategory() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (categoryData: Omit<CategoryFormValues, 'image'>) => createCategory(categoryData),
        onSuccess: (newCategory) => {
            // Optimistically update the cache
            queryClient.setQueryData<Category[]>(["categories"], (old) => {
                if (!old) return [newCategory];
                return [...old, newCategory].sort((a, b) => Number(a.position) - Number(b.position));
            });
        },
        onError: () => {
            // In case of error, invalidate cache to reload data
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
    });
}

// Mutation to update an existing category
export function useUpdateCategory() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ categoryId, categoryData }: { categoryId: number; categoryData: Omit<CategoryFormValues, 'image'> }) => 
            updateCategory(categoryId, categoryData),
        onSuccess: (updatedCategory) => {
            // Optimistically update the cache
            queryClient.setQueryData<Category[]>(["categories"], (old) => {
                if (!old) return [updatedCategory];
                return old
                    .map(c => c.id === updatedCategory.id ? { ...c, ...updatedCategory } : c)
                    .sort((a, b) => Number(a.position) - Number(b.position));
            });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
    });
}

// Mutation to upload/update category image
export function useUploadCategoryImage() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ categoryId, imageFile }: { categoryId: number; imageFile: File }) => 
            setCategoryImage(categoryId, imageFile),
        onSuccess: (updatedCategory) => {
            // Optimistically update the cache with the new image
            queryClient.setQueryData<Category[]>(["categories"], (old) => {
                if (!old) return old;
                return old.map(c => 
                    c.id === updatedCategory.id ? { ...c, ...updatedCategory } : c
                );
            });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
    });
}

// Mutation to toggle category availability
export function useToggleCategoryAvailability() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (categoryId: number) => setCategoryAvailable(categoryId),
        onSuccess: (_, categoryId) => {
            // Optimistically update the cache
            queryClient.setQueryData<Category[]>(["categories"], (old) => {
                if (!old) return old;
                return old.map(c => 
                    c.id === categoryId ? { ...c, available: !c.available } : c
                );
            });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
    });
}

// Mutation to delete a category
export function useDeleteCategory() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (categoryId: number) => deleteCategory(categoryId),
        onSuccess: (_, categoryId) => {
            // Optimistically remove from cache
            queryClient.setQueryData<Category[]>(["categories"], (old) => {
                if (!old) return old;
                return old.filter(c => c.id !== categoryId);
            });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
    });
}