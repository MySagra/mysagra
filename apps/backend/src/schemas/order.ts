import { PaymentMethod } from "@generated/prisma_client"
import z from "zod"

const orderItemSchema = z.object({
    foodId: z.string().cuid(),
    quantity: z.number().int().min(1),
    notes: z.string().min(1).optional()
})

export const orderSchema = z.object({
    table: z.string().min(0),
    customer: z.string().min(1),
    orderItems: z.array(orderItemSchema)
})

export const status = z.enum(["CONFIRMED", "COMPLETED", "PICKED_UP"]);

export const patchStatusSchema = z.object({
    status
})

export const getConfirmedOrdersFilterSchema = z.object({
    filter: z.union([status, z.array(status)]).optional()
})

export const confirmedOrderSchema = z.object({
    paymentMethod: z.enum(["CASH", "CARD"]),
    discount: z.number().min(0).optional(),
    surcharge: z.number().min(0).optional(),
    total: z.number().min(0).optional(),
    orderItems: z.array(orderItemSchema).optional()
})

export const createAndConfirmOrderSchema = z.object({
    confirm: confirmedOrderSchema,
    order: orderSchema
})

export const orderCodeParamSchema = z.object({
    code: z.string().regex(/^[A-Z0-9]+$/, "Order ID must contain only uppercase letters and numbers").min(3)
})

const excludeSchema = z.enum(["confirmed"])
export const orderQuerySchema = z.object({
    exclude: excludeSchema.optional()
})

export type ConfirmedOrder = z.infer<typeof confirmedOrderSchema>
export type Order = z.infer<typeof orderSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type Status = z.infer<typeof status>
export type PatchStatus = z.infer<typeof patchStatusSchema>
export type ConfirmedOrdersFilter = z.infer<typeof getConfirmedOrdersFilterSchema>
export type OrderQuery = z.infer<typeof orderQuerySchema>
export type OrderExclude = z.infer<typeof excludeSchema>
export type CreateAndConfirmOrder = z.infer<typeof createAndConfirmOrderSchema>