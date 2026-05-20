import { Channel, EventName } from "@mysagra/schemas"
import { ServiceIF } from "./ServiceIF"

export interface RecoverableService {
    recoverEvents: (channel: Channel, eventName: EventName, id: string, timestamp: string) => void
}