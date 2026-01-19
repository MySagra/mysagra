import z from "zod";
import { registry } from "../registry";

const ChannelSchema = z.enum(["cashier", "display", "printer"])
    .describe("Event channel type for real-time notifications")
    .openapi("Channel", {
        description: "Available channels for Server-Sent Events",
        example: "cashier"
    })

const EventNameSchema = z.enum(["new-order", "confirmed-order", "food-availability-changed", "printer-status-changed"])
    .describe("Type of event being broadcasted")
    .openapi("EventName", {
        description: "Available event types",
        example: "new-order"
    })

export const EventSchema = z.object({
    channel: ChannelSchema.describe("The channel to subscribe to")
}).openapi("Event", {
    description: "Event subscription parameters",
    example: {
        channel: "cashier"
    }
})

export type EventParams = z.infer<typeof EventSchema>
export type Channel = z.infer<typeof ChannelSchema>
export type EventName = z.infer<typeof EventNameSchema>

registry.register("Event", EventSchema)