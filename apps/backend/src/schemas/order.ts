import { PaymentMethod } from "@generated/prisma_client"
import z, { boolean } from "zod"

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

export const statusSchema = z.enum(["CONFIRMED", "COMPLETED", "PICKED_UP"]);

export const patchStatusSchema = z.object({
    status: statusSchema
})

export const getConfirmedOrdersFilterSchema = z.object({
    filter: z.union([statusSchema, z.array(statusSchema)]).optional()
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
    search: z.string().optional(),
    confirmed: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().default(1),

    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.enum(['createdAt']).optional().default('createdAt'),

    status: z.preprocess(
        (val) => {
            if (!val) return undefined;
            return Array.isArray(val) ? val : [val];
        },
        z.array(statusSchema).optional()
    ),

    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
}).refine(data => {
    if (data.confirmed === false && data.status) {
        return false;
    }
    return true;
}, {
    message: "You cannot filter by 'status' when 'confirmed' is 'false'",
    path: ["status"]
});

export type ConfirmedOrder = z.infer<typeof confirmedOrderSchema>
export type Order = z.infer<typeof orderSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type Status = z.infer<typeof statusSchema>
export type PatchStatus = z.infer<typeof patchStatusSchema>
export type ConfirmedOrdersFilter = z.infer<typeof getConfirmedOrdersFilterSchema>
export type OrderQuery = z.infer<typeof orderQuerySchema>
export type OrderExclude = z.infer<typeof excludeSchema>
export type CreateAndConfirmOrder = z.infer<typeof createAndConfirmOrderSchema>