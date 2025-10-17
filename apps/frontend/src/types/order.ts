import { FoodsOrderd } from "./foodOrdered"
import { Page } from "./page"

export type OrderRequest = {
    dateTime: Date,
    table: number,
    customer: string,
    foodsOrdered: Array<{
        foodId: number,
        quantity: number
    }>
}
export type Order = {
    id: string,
    dateTime: Date,
    table: number,
    customer: string,
    price?: number
    foodsOrdered: Array<FoodsOrderd>
}

export type PageOrder = {
    orders: Array<Order>
    pagination: Page
}