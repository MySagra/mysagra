import { z } from 'zod'
import 'zod-openapi'

export const OrderStatusSchema = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "PICKED_UP"]).meta({
    id: "OrderStatus",
    description: "Order fulfillment status",
    example: "PENDING"
})

export const PaymentMethodSchema = z.enum(["CASH", "CARD"]).meta({
    id: "PaymentMethod",
    description: "Payment method used",
    example: "CASH"
})

export const OrderItemInputSchema = z.object({
    foodId: z.cuid().meta({
        description: "Food item identifier"
    }),
    quantity: z.number().int().min(1).meta({
        description: "Quantity ordered",
        example: 2
    }),
    notes: z.string().optional().meta({
        description: "Special instructions for this item"
    }),
    unitPrice: z.number().optional().meta({
        description: "Price per unit at order time"
    }),
    surcharge: z.number().default(0).meta({
        description: "Additional charge for this item"
    }),
    total: z.number().optional().meta({
        description: "Total price for this item"
    })
}).meta({
    id: "OrderItemInput",
    description: "Food item included in an order"
})

export const OrderItemResponseSchema = z.object({
    id: z.cuid().meta({
        description: "Unique identifier for order item"
    }),
    quantity: z.number().int().meta({
        description: "Quantity ordered"
    }),
    notes: z.string().nullish().meta({
        description: "Special instructions"
    }),
    food: z.object({
        id: z.string().meta({
            description: "Food item identifier"
        }),
        name: z.string().meta({
            description: "Food item name"
        }),
        price: z.number().meta({
            description: "Food item base price"
        })
    }).optional().meta({
        description: "Food item details"
    }),
    unitPrice: z.number().meta({
        description: "Price per unit at order time"
    }),
    surcharge: z.number().default(0).meta({
        description: "Additional charge"
    }),
    total: z.number().meta({
        description: "Total price for this item"
    })
}).meta({
    id: "OrderItemResponse",
    description: "Food item in confirmed order with pricing"
})

const ConfirmationDataSchema = z.object({
    paymentMethod: PaymentMethodSchema.meta({
        description: "How the order was/will be paid"
    }),
    cashRegisterId: z.string().cuid().meta({
        description: "Cash register processing the order"
    }),
    userId: z.cuid().optional().meta({
        description: "User confirming the order"
    }),
    discount: z.number().min(0).default(0).meta({
        description: "Discount amount applied"
    })
}).meta({
    id: "ConfirmationData",
    description: "Order confirmation details"
})

export const CreateOrderSchema = z.object({
    table: z.string().min(1).meta({
        description: "Table number or location identifier",
        example: "Table 5"
    }),
    customer: z.string().min(1).meta({
        description: "Customer name",
        example: "John Doe"
    }),
    orderItems: z.array(OrderItemInputSchema)
        .min(1).meta({
            description: "Items in the order"
        }),
    confirm: ConfirmationDataSchema.optional().meta({
        description: "Immediate confirmation data"
    })
}).meta({
    id: "CreateOrderRequest",
    description: "Payload to create a new order"
})

export const ConfirmOrderSchema = ConfirmationDataSchema.extend({
    orderItems: z.array(OrderItemInputSchema).optional().meta({
        description: "Optional updated items"
    })
}).meta({
    id: "ConfirmOrderRequest",
    description: "Payload to confirm/checkout an order"
})

export const PatchOrderSchema = z.object({
    status: OrderStatusSchema.meta({
        description: "New order status"
    })
}).meta({
    id: "PatchOrderRequest",
    description: "Payload to update order status"
})

export const GetOrdersQuerySchema = z.object({
    search: z.string().optional().meta({
        description: "Search by table, customer, or display code"
    }),
    displayCode: z.string().length(3).optional().meta({
        description: "Filter by 3-character display code"
    }),
    page: z.coerce.number().int().positive().default(1).meta({
        description: "Page number for pagination"
    }),
    limit: z.coerce.number().int().positive().max(100).default(20).meta({
        description: "Items per page"
    }),
    sortBy: z.enum(['createdAt']).optional().default('createdAt').meta({
        description: "Sort field"
    }),
    status: z.preprocess(
        (val) => {
            if (!val) return undefined;
            return Array.isArray(val) ? val : [val];
        },
        z.array(OrderStatusSchema).optional().meta({
            description: "Filter by status(es)"
        })
    ),
    dateFrom: z.coerce.date().optional().meta({
        description: "Filter orders created after this date"
    }),
    dateTo: z.coerce.date().optional().meta({
        description: "Filter orders created before this date"
    })
}).meta({
    id: "GetOrdersQuery",
    description: "Query parameters for listing orders"
})

export const OrderIdParamSchema = z.object({
    id: z.coerce.number().int().positive().meta({
        description: "Numeric order identifier"
    })
}).meta({
    id: "OrderIdParam",
    description: "Path parameter for numeric order ID"
})

export const OrderCodeSchema = z.object({
    code: z.string().regex(/^[A-Z0-9]+$/).min(3).meta({
        description: "3+ character alphanumeric display code",
        example: "ABC123"
    })
}).meta({
    id: "OrderCode",
    description: "Order display/receipt code"
})

export const OrderResponseSchema = z.object({
    id: z.number().int().meta({
        description: "Unique order identifier"
    }),
    displayCode: OrderCodeSchema.meta({
        description: "Customer-facing code for order reference"
    }),
    ticketNumber: z.number().int().nullish().meta({
        description: "Kitchen printer ticket number"
    }),
    table: z.string().meta({
        description: "Table/location identifier"
    }),
    customer: z.string().meta({
        description: "Customer name"
    }),
    status: OrderStatusSchema.meta({
        description: "Current order status"
    }),
    createdAt: z.date().meta({
        description: "Order creation timestamp"
    }),
    confirmedAt: z.date().nullish().meta({
        description: "Timestamp when order was confirmed"
    }),
    subTotal: z.number().meta({
        description: "Sub-total before discounts/charges"
    }),
    total: z.number().meta({
        description: "Final total amount"
    }),
    discount: z.number().meta({
        description: "Total discount applied"
    }),
    surcharge: z.number().meta({
        description: "Total additional charges"
    }),
    paymentMethod: PaymentMethodSchema.nullish().meta({
        description: "Payment method used"
    }),
    orderItems: z.array(OrderItemResponseSchema).optional().meta({
        description: "Order items with pricing"
    })
}).meta({
    id: "OrderResponse",
    description: "Complete order entity with items and pricing"
})

export const ReprintOrderSchema = z.object({
    orderItems: z.array(z.cuid()).optional().meta({
        description: "Specific order items to reprint"
    }),
    reprintReceipt: z.boolean().meta({
        description: "Whether to reprint customer receipt"
    })
}).refine(data => data.orderItems || data.reprintReceipt, {
    message: "At least one of 'orderItems' or 'reprintReceipt' must be provided"
}).meta({
    id: "ReprintOrderRequest",
    description: "Payload to reprint order or receipt"
})

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

export type ReprintOrder = z.infer<typeof ReprintOrderSchema>