import { Food } from "@/types/food";

export async function getFoods(): Promise<Array<Food>> {
    return await fetch(`${process.env.API_URL}/v1/foods`, { next: { tags: ['foods'] }})
        .then(res => res.json())
}

export async function getFoodsAvailable(categoryId: string): Promise<Array<Food>> {
    return await fetch(`${process.env.API_URL}/v1/foods/available/categories/${categoryId}`, { next: { tags: ['foods'] }})
        .then(res => res.json())
}