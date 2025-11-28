import z from "zod"

export const OrderStatusSchema = z.enum(["PENDING","CONFIRMED", "COMPLETED", "PICKED_UP"]);
export const PaymentMethodSchema = z.enum(["CASH", "CARD"])

export const OrderItemInputSchema = z.object({
    foodId: z.string().cuid(),
    quantity: z.number().int().min(1),
    notes: z.string().optional()
});

export const OrderItemResponseSchema = z.object({
    id: z.string().cuid(),
    quantity: z.number().int(),
    notes: z.string().nullish(),
    food: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number()
    }).optional()
});

const ConfirmationDataSchema = z.object({
    paymentMethod: PaymentMethodSchema,
    discount: z.number().min(0).default(0),
    surcharge: z.number().min(0).default(0),
    cashRegisterId: z.string().cuid(),
    userId: z.string().cuid().optional()
});

export const CreateOrderSchema = z.object({
    table: z.string().min(1),
    customer: z.string().min(1),
    orderItems: z.array(OrderItemInputSchema)
        .min(1),
    confirm: ConfirmationDataSchema.optional()
});

export const ConfirmOrderSchema = ConfirmationDataSchema.extend({
    orderItems: z.array(OrderItemInputSchema).optional()
});

export const PatchOrderSchema = z.object({
    status: OrderStatusSchema
})

export const GetOrdersQuerySchema = z.object({
    search: z.string().optional(),
    displayCode: z.string().length(3).optional(),
    page: z.coerce.number().int().positive().default(1),

    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.enum(['createdAt']).optional().default('createdAt'),

    status: z.preprocess(
        (val) => {
            if (!val) return undefined;
            return Array.isArray(val) ? val : [val];
        },
        z.array(OrderStatusSchema).optional()
    ),

    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
});

export const OrderIdParamSchema = z.object({
    id: z.coerce.number().int().positive()
})

export const OrderCodeSchema = z.object({
    code: z.string().regex(/^[A-Z0-9]+$/).min(3)
});

export const OrderResponseSchema = z.object({
    id: z.number().int(), // È un Int in Prisma!
    displayCode: OrderCodeSchema,
    ticketNumber: z.number().int().nullish(),

    table: z.string(),
    customer: z.string(),
    status: OrderStatusSchema,

    createdAt: z.date(),
    confirmedAt: z.date().nullish(),

    subTotal: z.number(),
    total: z.number(),
    discount: z.number(),
    surcharge: z.number(),

    paymentMethod: PaymentMethodSchema.nullish(),

    // Relazione Items
    orderItems: z.array(OrderItemResponseSchema).optional()
});

export type OrderStatus = z.infer<typeof OrderStatusSchema>
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>

export type CreateOrder = z.infer<typeof CreateOrderSchema>
export type ConfirmOrderInput = z.infer<typeof ConfirmOrderSchema>
export type PatchOrderInput = z.infer<typeof PatchOrderSchema>

export type GetOrdersQueryParams = z.infer<typeof GetOrdersQuerySchema>
export type OrderIdParam = z.infer<typeof OrderIdParamSchema>
export type OrderResponse = z.infer<typeof OrderResponseSchema>
export type OrderItem = z.infer<typeof OrderItemInputSchema>
export type ConfirmationData = z.infer<typeof ConfirmationDataSchema>