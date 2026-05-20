import { logger } from "@/config/logger";
import { Response } from "express";
import { Channel, EventName, EventParams } from "@mysagra/schemas";
import { TypedRequest } from "@/types/request";
import { RecoverableService } from "@/common/RecoverableService";
import { prisma } from "@mysagra/database";

export class EventsService {
    private static instances = new Map<Channel, EventsService>
    private channel: string;
    private clients = new Set<Response>();

    private async _recoverOrders(lastEventId: string, client: Response) {
        const lastEventDate = new Date(Number(lastEventId));

        const confirmedOrders = await prisma.order.findMany({
            where: {
                confirmedAt: { gte: lastEventDate }
            },
            select: {
                id: true,
                displayCode: true,
                ticketNumber: true
            }
        });

        for (const o of confirmedOrders) {
            const ordersStations = (await prisma.$queryRaw<Array<{ stationId: string }>>`
                SELECT DISTINCT os.stationId
                FROM orders_stations_states os
                WHERE os.orderId = ${o.id}
            `).map(({ stationId }) => stationId);

            this.broadcastEvent(
                { ...o, ordersStations },
                "confirmed-order", undefined, client
            );
        }

        const orderStationStatus = await prisma.orderStationStatus.findMany({
            where: {
                updatedAt: { gte: lastEventDate }
            },
            select: {
                orderId: true,
                stationId: true,
                status: true
            }
        });

        for (const o of orderStationStatus) {
            this.broadcastEvent(o, "order-station-status-update", undefined, client);
        }

        const updatedOrders = await prisma.order.findMany({
            where: {
                updatedAt: { gte: lastEventDate }
            },
            select: {
                id: true,
                displayCode: true,
                ticketNumber: true,
                status: true
            }
        });

        for (const o of updatedOrders) {
            if (o.status === "CANCELLED") {
                this.broadcastEvent(o, "order-cancelled", undefined, client);
            }
            else {
                this.broadcastEvent(o, "order-status-update", undefined, client);
            }
        }
    }

    static getInstance(channel: Channel, recoveryProvider?: RecoverableService) {
        let instance = this.instances.get(channel);

        if (!instance) {
            instance = new EventsService(channel);
            this.instances.set(channel, instance);
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
        const lastEventId = req.headers['last-event-id']?.toString();
        this.clients.add(res);

        if (lastEventId) this._recoverOrders(lastEventId, res);
    }

    removeClient(res: Response) {
        logger.info('[SSE] Client disconnected', { size: this.clients.size })
        this.clients.delete(res);
    }

    broadcastEvent<T>(
        data: T,
        eventName?: EventName,
        id: string | number | Date = Date.now(),
        client?: Response
    ): void {
        logger.info(`[SSE] Broadcasting to ${client ? "rejoined client" : this.clients.size + " clients"}`, JSON.stringify({
            size: this.clients.size,
            event: eventName,
            data
        }));

        const eventId = id instanceof Date ? id.toISOString() : id.toString();

        const idLine = `id: ${eventId}\n`;
        const eventLine = eventName ? `event: ${eventName}\n` : "";
        const dataLine = `data: ${JSON.stringify(data)}\n\n`;

        const message = idLine + eventLine + dataLine;

        if (client) {
            client.write(message);
        }
        else {
            for (const client of this.clients) {
                client.write(message);
            }
        }
    }

    destroyConnections() {
        const size = this.clients.size;
        this.clients.forEach(client => {
            client.write("retry: 20000\n\n", () => client.destroy());
        });
        return size;
    }

    static broadcastEvents<T>(events: Array<EventsService>, data: T, eventName: EventName) {
        for (const event of events) {
            event.broadcastEvent(data, eventName);
        }
    }
}