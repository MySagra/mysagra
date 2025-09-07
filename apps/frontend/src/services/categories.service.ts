import { Category } from "@/types/category";

export async function getCategories() : Promise<Array<Category>> {
    return await fetch(`${process.env.API_URL}/v1/categories/available`, { next: { tags: ['category'] }})
        .then(res => res.json())
        .catch(err => console.log(err));
}