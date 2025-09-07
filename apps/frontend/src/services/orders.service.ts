import { getJwtFromCookie } from "@/lib/auth/verifyjwt";
import { PageOrder } from "@/types/order";

export async function getOrders(page: number): Promise<PageOrder> {
    return await fetch(`${process.env.API_URL}/v1/orders/pages/${page}`, {
        next: { tags: ['orders']},
        method: "GET",
        headers: {
            "Authorization": `Bearer ${await getJwtFromCookie()}`
        }
    }).then(res => res.json());
}

export async function getDailyOrders(): Promise<PageOrder> {
    return await fetch(`${process.env.API_URL}/v1/orders/day/today`, {
        next: { tags: ['orders']},
        method: "GET",
        headers: {
            "Authorization": `Bearer ${await getJwtFromCookie()}`
        }
    }).then(res => res.json());
}