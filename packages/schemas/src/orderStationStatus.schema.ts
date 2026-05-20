import { z } from "zod"
import { OrderStatusSchema } from "./order.schema"

export const OrderStationResponseSchema = z.object({
    id: z.cuid(),
    orderId: z.cuid(),
    stationId: z.cuid(),
    status: OrderStatusSchema
}).meta({
    description: "Order status at specific station",
    example: {
        id: "clv1abc2defghijklmnopqrst",
        orderId: "clv1xyz2defghijklmnopqrst",
        stationId: "clv1def2ghijklmnopqrstuvw",
        status: "pending"
    }
})

export const PatchOrderStationStatusParamsSchema = z.object({
    orderId: z.cuid(),
    stationId: z.cuid()
}).meta({
    description: "URL parameters for updating order station status",
    example: {
        orderId: "clv1xyz2defghijklmnopqrst",
        stationId: "clv1def2ghijklmnopqrstuvw"
    }
})

export const PatchOrderStationInputSchema = z.object({
    status: OrderStatusSchema
}).meta({
    description: "Request body for updating order status at station",
    example: {
        status: "completed"
    }
})

export type OrderStationResponse = z.infer<typeof OrderStationResponseSchema>
export type PatchOrderStationInput = z.infer<typeof PatchOrderStationInputSchema>
export type PatchOrderStationStatusParams = z.infer<typeof PatchOrderStationStatusParamsSchema>