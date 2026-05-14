import { logger } from "@/config/logger";
import { Response } from "express";
import { Channel, EventName, EventParams } from "@mysagra/schemas";
import { TypedRequest } from "@/types/request";
import { RecoverableService } from "@/common/RecoverableService";

export class EventsService {
    private static instances = new Map<Channel, EventsService>
    private channel: string;
    private clients = new Set<Response>();
    private recoveryProvider?: RecoverableService;

    // Modified to optionally accept a recovery provider
    static getInstance(channel: Channel, recoveryProvider?: RecoverableService) {
        let instance = this.instances.get(channel);

        if (!instance) {
            instance = new EventsService(channel);
            this.instances.set(channel, instance);
        }

        // Update or set the provider if passed
        if (recoveryProvider) {
            instance.recoveryProvider = recoveryProvider;
        }

        return instance;
    }

    private constructor(channel: string) {
        this.channel = channel;
    }

    getChannel() {
        return this.channel;
    }

    addClient(res: Response, req: TypedRequest<{ params: EventParams }>) {
        logger.info('[SSE] Client connected', { size: this.clients.size })
        this.clients.add(res);
    }

    removeClient(res: Response) {
        logger.info('[SSE] Client disconnected', { size: this.clients.size })
        this.clients.delete(res);
    }

    broadcastEvent<T>(
        data: T,
        eventName?: EventName,
        id: string | number | Date = Date.now()
    ): void {
        logger.info(`[SSE] Broadcasting to ${this.clients.size} clients`, JSON.stringify({
            size: this.clients.size,
            event: eventName,
            data
        }));

        const eventId = id instanceof Date ? id.toISOString() : id.toString();

        const idLine = `id: ${eventId}\n`;
        const eventLine = eventName ? `event: ${eventName}\n` : "";
        const dataLine = `data: ${JSON.stringify(data)}\n\n`;

        const message = idLine + eventLine + dataLine;

        for (const client of this.clients) {
            client.write(message);
        }
    }

    static broadcastEvents<T>(events: Array<EventsService>, data: T, eventName: EventName) {
        for (const event of events) {
            event.broadcastEvent(data, eventName);
        }
    }
}