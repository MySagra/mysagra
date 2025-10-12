'use client'

import { useMutation } from "@tanstack/react-query"
import { createOrder } from "@/services/orders.service";
import { OrderRequest } from "@/types/order";
import { useQueryClient } from "@tanstack/react-query";

export function useCreateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (order: OrderRequest) => createOrder(order),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orderStats"] });
            queryClient.invalidateQueries({ queryKey: ["foodsStats"] });
            queryClient.invalidateQueries({ queryKey: ["revenueStats"] });
        }
    });
}