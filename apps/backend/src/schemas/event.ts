import z from "zod";

const channelSchema = z.enum(["cashier", "display", "printer"])
const eventName = z.enum(["new-order", "confirmed-order", "food-availability-changed"])

export const eventSchema = z.object({
    channel: channelSchema
})

export type EventParams = z.infer<typeof eventSchema>;
export type Channel = z.infer<typeof channelSchema>;
export type EventName = z.infer<typeof eventName>;