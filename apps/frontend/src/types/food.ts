import { Category } from "./category"

export type Food = {
    id: number,
    name: string,
    description?: string,
    price: number,
    categoryId?: number,
    category?: Category,
    available?: boolean
}