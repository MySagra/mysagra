'use client'

import { useMutation, useQuery } from "@tanstack/react-query"
import { createOrder, getDailySearchOrders, getOrders, searchOrder, deleteOrder } from "@/services/orders.service";
import { OrderRequest } from "@/types/order";
import { useQueryClient } from "@tanstack/react-query";
import { getDailyOrders } from "@/services/orders.service";

export function useOrderByPage(page: number) {
    return useQuery({
        queryKey: ["orders", page],
        queryFn: () => getOrders(page),
        enabled: !!page,
    });
}

export function useCreateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (order: OrderRequest) => createOrder(order),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dailyOrders"] })
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["orderStats"] });
            queryClient.invalidateQueries({ queryKey: ["foodsStats"] });
            queryClient.invalidateQueries({ queryKey: ["revenueStats"] });
        }
    });
}

export function useDailyOrders() {
    return useQuery({
        queryKey: ["dailyOrders"],
        queryFn: getDailyOrders
    })
}

export function useDailySearchOrder(value: string) {
    return useQuery({
        queryKey: ["dailyOrders", "search", value],
        queryFn: () => getDailySearchOrders(value),
        enabled: value.trim().length > 0
    })
}

// Query to search orders by value (code, table, etc.)
export function useSearchOrder(value: string) {
    return useQuery({
        queryKey: ["orders", "search", value],
        queryFn: () => searchOrder(value),
        enabled: value.trim().length > 0,
        staleTime: 0 // Always fetch fresh data when searching
    });
}

// Mutation to delete an order
export function useDeleteOrder() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (orderId: string) => deleteOrder(orderId),
        onSuccess: () => {
            // Invalidate all order-related queries to refetch data
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["dailyOrders"] });
            queryClient.invalidateQueries({ queryKey: ["orderStats"] });
            queryClient.invalidateQueries({ queryKey: ["foodsStats"] });
            queryClient.invalidateQueries({ queryKey: ["revenueStats"] });
        },
        onError: () => {
            // In case of error, invalidate cache to reload data
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["dailyOrders"] });
        }
    });
}