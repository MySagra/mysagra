'use client'

import { useQuery } from "@tanstack/react-query"
import { getFoodsAvailable } from "@/services/foods.service"

export function useFoodsByCategory(categoryId: string) {
    return useQuery({
        queryKey: ["categoryFoods", categoryId],
        queryFn: () => getFoodsAvailable(categoryId),
        enabled: !!categoryId,
        staleTime: 1000 * 60 * 5
    });
}