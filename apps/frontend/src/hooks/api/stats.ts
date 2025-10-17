'use client'

import { getFoodsOrderedStats, getOrderStats, getRevenueStats } from "@/services/stats.service";
import { useQuery } from "@tanstack/react-query";

export function useOrderStats() {
    return useQuery({
        queryKey: ["orderStats"],
        queryFn: getOrderStats
    });
}

export function useFoodsStats() {
    return useQuery({
        queryKey: ["foodsStats"],
        queryFn: getFoodsOrderedStats
    });
}

export function useRevenueStats() {
    return useQuery({
        queryKey: ["revenueStats"],
        queryFn: getRevenueStats
    });
}