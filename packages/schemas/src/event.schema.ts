import { z } from 'zod'

const ChannelSchema = z.enum(["cashier", "display", "printer"]).meta({
    id: "Channel",
    description: "Event channel/destination",
    example: "cashier"
})

const eventName = z.enum([
    "new-order",
    "confirmed-order",
    "food-availability-changed",
    "printer-status-changed",
    "reprint-order",
    "order-status-update"
]).meta({
    id: "EventName",
    description: "Type of event",
    example: "new-order"
})

export const eventSchema = z.object({
    channel: ChannelSchema.meta({
        description: "Target channel for event subscription"
    })
}).meta({
    id: "EventParams",
    description: "Event subscription parameters"
})

export type EventParams = z.infer<typeof eventSchema>;
export type Channel = z.infer<typeof ChannelSchema>;
export type EventName = z.infer<typeof eventName>;
