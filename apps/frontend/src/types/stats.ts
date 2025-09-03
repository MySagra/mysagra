export type OrderStats = {
    totalOrders: number
    ordersPerDay: Array<{
        day: Date,
        count: number
    }>
}

export type FoodStats = {
    foodOrdered: Array<{
        food: string,
        quantity: string,
        price: string
    }>
}

export type RevenueStats = {
    revenuePerDay: Array<{
        day: Date,
        revenue: number
    }>
}