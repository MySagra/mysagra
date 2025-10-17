'use client'

import { useMutation, useQuery } from "@tanstack/react-query"
import { createOrder, getDailySearchOrders } from "@/services/orders.service";
import { OrderRequest } from "@/types/order";
import { useQueryClient } from "@tanstack/react-query";
import { getDailyOrders } from "@/services/orders.service";

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