import { Response } from "express";
import { EventsService } from "@/modules/events/events.service";
import { EventParams } from "@mysagra/schemas";
import { TypedRequest } from "@/types/request";
import { asyncHandler } from "@/utils/asyncHandler";

export class EventsController {
    handleSseConnection = asyncHandler(async (
        req: TypedRequest<{ params: EventParams }>,
        res: Response,
    ): Promise<void> => {
        const { channel } = req.validated.params;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const event = EventsService.getInstance(channel);
        event.addClient(res, req);

        // Hearthbeat
        res.write(`id: ${Date.now()}\n: keepalive\n\n`) // first hearthbeat for connection
        const keepAliveInterval = setInterval(() => res.write(`id: ${Date.now()}\n: keepalive\n\n`), 15000);

        req.on('close', () => {
            clearInterval(keepAliveInterval);
            event.removeClient(res);
        });
    })

    destroyConnections = asyncHandler(async (
        req: TypedRequest<{ params: EventParams }>,
        res: Response,
    ): Promise<void> => {
        const { channel } = req.validated.params;
        const event = EventsService.getInstance(channel);
        const size = event.destroyConnections()
        res.status(200).json({ connections: size });
    })
}