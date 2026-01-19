import z from "zod"
import { registry } from "../registry"

export const OrderStatusSchema = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "PICKED_UP"])
    .describe("Current status of the order")
    .openapi("OrderStatus", {
        description: "Possible order statuses",
        example: "PENDING"
    })

export const PaymentMethodSchema = z.enum(["CASH", "CARD"])
    .describe("Payment method used for the order")
    .openapi("PaymentMethod", {
        description: "Available payment methods",
        example: "CASH"
    })

export const OrderItemRequestSchema = z.object({
    foodId: z.cuid().describe("ID of the food item"),
    quantity: z.number().int().min(1).describe("Quantity of items ordered"),
    notes: z.string().optional().describe("Special notes for this item")
}).openapi("OrderItemRequest", {
    description: "Order item input data",
    example: {
        foodId: "clh1234567890abcdef",
        quantity: 2,
        notes: "No onions"
    }
})

export const OrderItemResponseSchema = z.object({
    id: z.cuid().describe("Unique identifier of the order item"),
    quantity: z.number().int().describe("Quantity of items ordered"),
    notes: z.string().nullish().describe("Special notes for this item"),
    food: z.object({
        id: z.string().describe("Food item ID"),
        name: z.string().describe("Food item name"),
        price: z.number().describe("Food item price")
    }).optional().describe("Food item details")
}).openapi("OrderItemResponse", {
    description: "Order item data returned from the API",
    example: {
        id: "clh1234567890abcdef",
        quantity: 2,
        notes: "No onions",
        food: {
            id: "clhfood12345",
            name: "Margherita Pizza",
            price: 8.50
        }
    }
})

const ConfirmationDataSchema = z.object({
    paymentMethod: PaymentMethodSchema.describe("Payment method for the order"),
    discount: z.number().min(0).default(0).describe("Discount amount applied"),
    surcharge: z.number().min(0).default(0).describe("Surcharge amount applied"),
    cashRegisterId: z.cuid().describe("ID of the cash register processing this order"),
    userId: z.cuid().optional().describe("ID of the user processing the order")
})

export const CreateOrderRequestSchema = z.object({
    table: z.string().min(1).describe("Table number or identifier"),
    customer: z.string().min(1).describe("Customer name"),
    orderItems: z.array(OrderItemRequestSchema)
        .min(1)
        .describe("List of items in the order"),
    confirm: ConfirmationDataSchema.optional().describe("Optional confirmation data to immediately confirm the order")
}).openapi("CreateOrderRequest", {
    description: "Request body for creating a new order",
    example: {
        table: "A1",
        customer: "John Doe",
        orderItems: [
            { foodId: "clh1234567890abcdef", quantity: 2, notes: "No onions" }
        ]
    }
})

export const ConfirmOrderRequestSchema = ConfirmationDataSchema.extend({
    orderItems: z.array(OrderItemRequestSchema).optional().describe("Updated list of items (optional)")
}).openapi("ConfirmOrderRequest", {
    description: "Request body for confirming an order",
    example: {
        paymentMethod: "CASH",
        discount: 0,
        surcharge: 0,
        cashRegisterId: "clh1234567890abcdef"
    }
})

export const PatchOrderRequestSchema = z.object({
    status: OrderStatusSchema.describe("New status for the order")
}).openapi("PatchOrderRequest", {
    description: "Request body for updating order status",
    example: {
        status: "COMPLETED"
    }
})

export const GetOrdersQuerySchema = z.object({
    search: z.string().optional().describe("Search term for customer name or table"),
    displayCode: z.string().length(3).optional().describe("Filter by display code"),
    page: z.coerce.number().int().positive().default(1).describe("Page number for pagination"),

    limit: z.coerce.number().int().positive().max(100).default(20).describe("Number of items per page"),
    sortBy: z.enum(['createdAt']).optional().default('createdAt').describe("Field to sort by"),

    status: z.preprocess(
        (val) => {
            if (!val) return undefined;
            return Array.isArray(val) ? val : [val];
        },
        z.array(OrderStatusSchema).optional()
    ).describe("Filter by status(es)"),

    dateFrom: z.coerce.date().optional().describe("Filter orders from this date"),
    dateTo: z.coerce.date().optional().describe("Filter orders until this date")
})

export const OrderIdParamSchema = z.object({
    id: z.coerce.number().int().positive().describe("Order ID")
}).openapi("OrderIdParam", {
    description: "Path parameter for order ID",
    example: {
        id: 123
    }
})

export const OrderCodeSchema = z.object({
    code: z.string().regex(/^[A-Z0-9]+$/).min(3).describe("Alphanumeric order code")
}).openapi("OrderCode", {
    description: "Order display code",
    example: {
        code: "A1B"
    }
})

export const OrderResponseSchema = z.object({
    id: z.number().int().describe("Unique numeric identifier of the order"),
    displayCode: OrderCodeSchema.describe("Display code for the order"),
    ticketNumber: z.number().int().nullish().describe("Ticket number for confirmed orders"),

    table: z.string().describe("Table number or identifier"),
    customer: z.string().describe("Customer name"),
    status: OrderStatusSchema.describe("Current status of the order"),

    createdAt: z.date().describe("Order creation timestamp"),
    confirmedAt: z.date().nullish().describe("Order confirmation timestamp"),

    subTotal: z.number().describe("Subtotal before discounts and surcharges"),
    total: z.number().describe("Final total amount"),
    discount: z.number().describe("Discount amount applied"),
    surcharge: z.number().describe("Surcharge amount applied"),

    paymentMethod: PaymentMethodSchema.nullish().describe("Payment method used"),

    orderItems: z.array(OrderItemResponseSchema).optional().describe("List of items in the order")
}).openapi("OrderResponse", {
    description: "Order data returned from the API",
    example: {
        id: 123,
        displayCode: { code: "A1B" },
        ticketNumber: 45,
        table: "A1",
        customer: "John Doe",
        status: "CONFIRMED",
        createdAt: "2026-01-19T10:30:00Z",
        confirmedAt: "2026-01-19T10:35:00Z",
        subTotal: 17.00,
        total: 17.00,
        discount: 0,
        surcharge: 0,
        paymentMethod: "CASH"
    }
})

export type OrderStatus = z.infer<typeof OrderStatusSchema>
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>
export type ConfirmOrderRequest = z.infer<typeof ConfirmOrderRequestSchema>
export type PatchOrderRequest = z.infer<typeof PatchOrderRequestSchema>

export type GetOrdersQueryParams = z.infer<typeof GetOrdersQuerySchema>
export type OrderIdParam = z.infer<typeof OrderIdParamSchema>
export type OrderResponse = z.infer<typeof OrderResponseSchema>
export type OrderItemRequest = z.infer<typeof OrderItemRequestSchema>
export type ConfirmationData = z.infer<typeof ConfirmationDataSchema>

registry.register("OrderStatus", OrderStatusSchema)
registry.register("PaymentMethod", PaymentMethodSchema)
registry.register("OrderItemRequest", OrderItemRequestSchema)
registry.register("OrderItemResponse", OrderItemResponseSchema)
registry.register("CreateOrderRequest", CreateOrderRequestSchema)
registry.register("ConfirmOrderRequest", ConfirmOrderRequestSchema)
registry.register("PatchOrderRequest", PatchOrderRequestSchema)
registry.register("OrderCode", OrderCodeSchema)
registry.register("OrderResponse", OrderResponseSchema)