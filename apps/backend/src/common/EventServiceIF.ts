import { Channel, EventName } from "@mysagra/schemas"
import { ServiceIF } from "./ServiceIF"

export interface EventsServiceIF extends ServiceIF {
    recoverEvents: (channel: Channel, eventName: EventName, id: string, timestamp: string) => void
}