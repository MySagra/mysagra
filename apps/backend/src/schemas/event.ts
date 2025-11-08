import z from "zod";

const channelSchema = z.enum(["order"])

export const eventSchema = z.object({
    channel: channelSchema
})

export type EventParams = z.infer<typeof eventSchema>;
export type Channel = z.infer<typeof channelSchema>