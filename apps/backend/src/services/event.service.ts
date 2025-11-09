import { logger } from "@/config/logger";
import { Response } from "express";
import { Channel, EventName } from "@/schemas/event";

export class EventService {
    private static events = new Map<Channel, EventService>
    private channel : string;
    private clients = new Set<Response>();

    static getIstance(channel: Channel){
        if(EventService.events.has(channel)){
            return EventService.events.get(channel)!;
        }

        const event = new this(channel);
        this.events.set(channel, event);
        return event;
    }

    private constructor(channel: string){
        this.channel = channel;
    }

    getChannel(){
        return this.channel;
    }
    
    addClient(res: Response){
        logger.info('[SSE] Client connected', { size: this.clients.size })
        this.clients.add(res);
    }

    removeClient(res: Response){
        logger.info('[SSE] Client disconnected', { size: this.clients.size })
        this.clients.delete(res);
    }

    broadcastEvent<T>(data: T, eventName?: EventName): void {
        logger.info(`[SSE] Broadcasting to ${this.clients.size} clients`, JSON.stringify({
            size: this.clients.size,
            event: eventName,
            data
        }));

        const eventLine = eventName ?  `event: ${eventName}\n` : ""
        const dataLine = `data: ${JSON.stringify(data)}\n\n`;

        const message = eventLine + dataLine;

        for(const client of this.clients){
            client.write(message);
        }
    }

    static broadcastEvents<T>(events: Array<EventService>, data: T, eventName: EventName){
        for(const event of events){
            event.broadcastEvent(data, eventName);
        }
    }
}