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

const SSEOrder = registry.register("SSEOrder", SSEOrderSchema);
const SSEConfirmedOrderSummaryResponse = registry.register("SSEConfirmedOrderSummary", SSEConfirmedOrderSummary);
const SSEReprintOrder = registry.register("SSEReprintOrder", SSEReprintOrderSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/events/{channel}",
    summary: "Subscribe to Server-Sent Events (SSE)",
    description: `Establishes a persistent SSE connection to receive real-time updates for the specified channel.

**Keep-alive** messages are sent every 15 seconds as \`: keep-alive\\n\\n\`.
**Data** messages are sent as \`data: {JSON}\\n\\n\`.

---

### \`cashier\` channel
- **\`new-order\`** — Fired when a new order is placed. Payload: full order object (\`SSEOrder\`).
- **\`confirmed-order\`** — Fired when an order is confirmed. Payload: \`SSEConfirmedOrderSummary\`.

### \`display\` channel
- **\`confirmed-order\`** — Fired when an order is confirmed. Payload: \`SSEConfirmedOrderSummary\`.

### \`printer\` channel
- **\`confirmed-order\`** — Fired when an order is confirmed (includes food details for printing). Payload: full order object (\`SSEOrder\`).
- **\`reprint-order\`** — Fired when a reprint is requested. Payload: \`SSEReprintOrder\`.`,
    tags: ["Events (SSE)"],
    security: [{ bearerAuth: [] }],
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
