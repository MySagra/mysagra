import { getJwtFromCookie } from "@/lib/auth/verifyjwt";
import { FoodStats, OrderStats, RevenueStats } from "@/types/stats";

export async function getOrderStats(): Promise<OrderStats> {
    return await fetch(`${process.env.API_URL}/v1/stats/total-orders`, {
        next: { tags: ['stats']},
        method: "GET",
        headers: {
            "Authorization": `Bearer ${await getJwtFromCookie()}`
        }
    }).then(res => res.json()).catch(err => console.log(err))
}

export async function getFoodsOrderedStats(): Promise<FoodStats> {
    return await fetch(`${process.env.API_URL}/v1/stats/foods-ordered`, {
        next: { tags: ['stats']},
        method: "GET",
        headers: {
            "Authorization": `Bearer ${await getJwtFromCookie()}`
        }
    }).then(res => res.json());
}

export async function getRevenueStats(): Promise<RevenueStats> {
    return await fetch(`${process.env.API_URL}/v1/stats/revenue`, {
        next: { tags: ['stats']},
        method: "GET",
        headers: {
            "Authorization": `Bearer ${await getJwtFromCookie()}`
        }
    }).then(res => res.json());
}