import { FoodsOrderd } from "./foodOrdered"
import { Page } from "./page"

export type OrderRequest = {
    dateTime: Date,
    table: string,
    customer: string,
    foodsOrdered: Array<FoodsOrderd>
}
export type Order = {
    id: string,
    dateTime: Date,
    table: string,
    customer: string,
    price?: number
    foodsOrdered: Array<FoodsOrderd>
}

export type PageOrder = {
    orders: Array<Order>
    pagination: Page
}