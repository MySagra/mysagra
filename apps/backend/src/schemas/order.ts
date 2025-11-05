import { PaymentMethod } from "@generated/prisma_client"
import z from "zod"

const orderItemSchema = z.object({
    foodId: z.string().cuid(),
    quantity: z.number().int().min(1),
    notes: z.string().min(1).optional()
})

export const orderSchema = z.object({
    table: z.number().min(0),
    customer: z.string().min(1),
    orderItems: z.array(orderItemSchema)
})

export const confirmedOrderSchema = z.object({
    orderId: z.number().int().min(0),
    paymentMethod: z.enum(["CASH", "CARD"]),
    discount: z.number().min(0).optional(),
    surcharge: z.number().min(0).optional(),
    total: z.number().min(0).optional(),
    orderItems: z.array(orderItemSchema)
})

export const orderCodeParamSchema = z.object({
    code: z.string().regex(/^[A-Z0-9]+$/, "Order ID must contain only uppercase letters and numbers").min(3)
})

export type ConfirmedOrder = z.infer<typeof confirmedOrderSchema>
export type Order = z.infer<typeof orderSchema>
export type OrderItem = z.infer<typeof orderItemSchema>