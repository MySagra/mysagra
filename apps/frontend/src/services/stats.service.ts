'use server'
import { FoodStats, OrderStats, RevenueStats } from "@/types/stats";
import { apiClient } from "@/lib/apiClient";

export async function getOrderStats(): Promise<OrderStats> {
    return (await apiClient.get('v1/stats/total-orders')).data;
}

export async function getFoodsOrderedStats(): Promise<FoodStats> {
    return (await apiClient.get('v1/stats/foods-ordered')).data;
}

export async function getRevenueStats(): Promise<RevenueStats> {
    return (await apiClient.get('v1/stats/revenue')).data;
}