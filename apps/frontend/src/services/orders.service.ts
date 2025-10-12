'use server'

import { getAccessToken } from "@/lib/auth/getTokens";
import { OrderRequest, PageOrder } from "@/types/order";
import { Order } from "@/types/order";
import { apiClient } from "@/lib/apiClient";

export async function createOrder(order: OrderRequest) : Promise<Order> {
    return (await apiClient.post<Order>("v1/orders", order)).data
}

export async function getOrders(page: number): Promise<PageOrder> {
    return (await apiClient.get<PageOrder>(`v1/orders/pages/${page}`, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}

export async function getDailyOrders(): Promise<PageOrder> {
    return (await apiClient.get<PageOrder>(`v1/orders/day/today`, {
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`
        }
    })).data;
}