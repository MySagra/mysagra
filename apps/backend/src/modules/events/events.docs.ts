import { z } from "zod";
import { registry } from "@/config/swagger";
import { eventSchema } from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const EventParams = registry.register("EventParams", eventSchema);

// ─── Inline response schemas ─────────────────────────────────────────────────

const SSEOrderItemSchema = z.object({
    id: z.string(),
    quantity: z.number().int(),
    orderId: z.number().int(),
    foodId: z.string().nullable(),
    unitPrice: z.string(),
    unitSurcharge: z.string(),
    total: z.string(),
    notes: z.string().nullable(),
    food: z
        .object({
            id: z.string(),
            name: z.string(),
            printerId: z.string().nullable(),
        })
        .optional(),
});

const SSEOrderSchema = z.object({
    id: z.number().int().meta({ example: 1 }),
    displayCode: z.string().meta({ example: "A01" }),
    table: z.string().nullable().meta({ example: "3" }),
    customer: z.string().nullable().meta({ example: "John Doe" }),
    createdAt: z.string().meta({ example: "2026-01-15T18:30:00.000Z" }),
    confirmedAt: z.string().nullable(),
    ticketNumber: z.number().int().nullable().meta({ example: 1 }),
    status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).meta({ example: "CONFIRMED" }),
    paymentMethod: z.string().nullable().meta({ example: "CASH" }),
    subTotal: z.string().meta({ example: "25" }),
    discount: z.string().meta({ example: "0" }),
    surcharge: z.string().meta({ example: "0" }),
    total: z.string().meta({ example: "25" }),
    userId: z.string().nullable(),
    cashRegisterId: z.string().nullable(),
    orderItems: z.array(SSEOrderItemSchema),
});

const SSEConfirmedOrderSummary = z.object({
    id: z.number().int().meta({ example: 1 }),
    displayCode: z.string().meta({ example: "A01" }),
    ticketNumber: z.number().int().meta({ example: 1 }),
});

const SSEReprintOrderSchema = SSEOrderSchema.extend({
    reprintReceipt: z.boolean().meta({ description: "Whether the receipt should also be reprinted" }),
    reprintOrderItems: z
        .array(SSEOrderItemSchema)
        .meta({ description: "Items selected for reprint" }),
});

const SSEFoodAvailabilitySchema = z.object({
    id: z.string().meta({ example: "cjld2cyuq0000t3rmniod1foy" }),
    available: z.boolean().meta({ example: true }),
}).meta({ id: "SSEFoodAvailability" });

const SSECategoryAvailabilitySchema = z.object({
    id: z.string().meta({ example: "cjld2cyuq0000t3rmniod1foy" }),
    available: z.boolean().meta({ example: false }),
}).meta({ id: "SSECategoryAvailability" });

const SSEPrinterStatusSchema = z.object({
    id: z.string().meta({ example: "cjld2cyuq0000t3rmniod1foy" }),
    status: z.enum(["ONLINE", "OFFLINE", "ERROR"]).meta({ example: "OFFLINE" }),
}).meta({ id: "SSEPrinterStatus" });

const SSEGeneralClosureReportSchema = z.object({
    id: z.string().meta({ example: "cjld2cyuq0000t3rmniod1foy" }),
    timestamp: z.coerce.date().meta({ example: "2026-01-15T19:00:00.000Z" }),
    intervalInMinutes: z.number().meta({ example: 720, description: "Total minutes covered by closure report" }),
    totalRevenue: z.number().meta({ example: 1234.50 }),
    totalCashRevenue: z.number().meta({ example: 567.25 }),
    totalCardRevenue: z.number().meta({ example: 667.25 }),
    totalOrders: z.number().int().meta({ example: 45 }),
    averageCompletitionTime: z.number().nullable().optional().meta({ example: 300000, description: "Average completion time in milliseconds" }),
    categoryStats: z.array(z.object({
        id: z.string(),
        reportId: z.string(),
        categoryId: z.string(),
        categoryName: z.string(),
        revenue: z.number(),
        quantity: z.number(),
        foodStats: z.array(z.object({
            id: z.string(),
            categoryStatsId: z.string(),
            foodId: z.string(),
            foodName: z.string(),
            revenue: z.number(),
            quantity: z.number()
        }))
    })),
    cashRegisterStats: z.array(z.object({
        id: z.string(),
        reportId: z.string(),
        cashRegisterId: z.string(),
        cashRegisterName: z.string(),
        totalRevenue: z.number(),
        totalCardRevenue: z.number(),
        totalCashRevenue: z.number()
    }))
}).meta({ id: "SSEGeneralClosureReport" });

registry.register("SSEOrder", SSEOrderSchema);
registry.register("SSEConfirmedOrderSummary", SSEConfirmedOrderSummary);
registry.register("SSEReprintOrder", SSEReprintOrderSchema);
registry.register("SSEFoodAvailability", SSEFoodAvailabilitySchema);
registry.register("SSECategoryAvailability", SSECategoryAvailabilitySchema);
registry.register("SSEPrinterStatus", SSEPrinterStatusSchema);
registry.register("SSEGeneralClosureReport", SSEGeneralClosureReportSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/events/{channel}",
    summary: "Subscribe to Server-Sent Events (SSE)",
    description: `Establishes a persistent SSE connection to receive real-time updates for the specified channel.

**Keep-alive** messages are sent every 15 seconds as \`: keep-alive\\n\\n\`.
**Data** messages are sent as \`data: {JSON}\\n\\n\`.

---

### \`cashier\` channel
- **\`new-order\`** — Fired when a new order is placed. Payload: full order object (\`SSEOrder\`).
- **\`confirmed-order\`** — Fired when an order is confirmed. Payload: \`SSEConfirmedOrderSummary\`.
- **\`food-availability-changed\`** — Fired when a food item's availability changes. Payload: \`SSEFoodAvailability\`.
- **\`category-availability-changed\`** — Fired when a category's availability changes. Payload: \`SSECategoryAvailability\`.
- **\`printer-status-changed\`** — Fired when a printer's status changes. Payload: \`SSEPrinterStatus\`.

### \`display\` channel
- **\`confirmed-order\`** — Fired when an order is confirmed. Payload: \`SSEConfirmedOrderSummary\`.

### \`printer\` channel
- **\`confirmed-order\`** — Fired when an order is confirmed (includes food details for printing). Payload: full order object (\`SSEOrder\`).
- **\`reprint-order\`** — Fired when a reprint is requested. Payload: \`SSEReprintOrder\`.
- **\`general-closure\`** — Fired when daily closure report is generated. Contains aggregated statistics for the day. Payload: \`SSEGeneralClosureReport\`.`,
    tags: ["Events (SSE)"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    request: { params: EventParams },
    responses: {
        200: {
            description:
                "SSE stream established. Connection stays open until the client disconnects.",
            content: {
                "text/event-stream": {
                    schema: z.string().meta({
                        description:
                            "Stream of SSE messages. Format: `data: {JSON}\\n\\n` or `: keep-alive\\n\\n`",
                    }),
                },
            },
        },
        400: {
            description: "Invalid channel parameter",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string().meta({ example: "Validation error" }),
                        errors: z.array(
                            z.object({
                                field: z.string(),
                                message: z.string(),
                            })
                        ),
                    }),
                },
            },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — operators and administrators only" },
    },
});
