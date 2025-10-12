'use client'

import { getFoodsOrderedStats, getOrderStats, getRevenueStats } from "@/services/stats.service";
import { useQuery } from "@tanstack/react-query";

export function useOrderStats() {
    return useQuery({
        queryKey: ["orderStats"],
        queryFn: getOrderStats,
        staleTime: 1000 * 60 * 5
    });
}

export function useFoodsStats() {
    return useQuery({
        queryKey: ["foodsStats"],
        queryFn: getFoodsOrderedStats,
        staleTime: 1000 * 60 * 5
    });
}

export function useRevenueStats() {
    return useQuery({
        queryKey: ["revenueStats"],
        queryFn: getRevenueStats,
        staleTime: 1000 * 60 * 5
    });
}