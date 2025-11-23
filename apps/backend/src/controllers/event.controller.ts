import { Response } from "express";
import { EventService } from "@/services/event.service";
import { EventParams } from "@/schemas/event";
import { TypedRequest } from "@/types/request";
import { asyncHandler } from "@/utils/asyncHandler";

export class EventController {
    handleSseConnection = asyncHandler(async (
        req: TypedRequest<{ params: EventParams }>,
        res: Response,
    ): Promise<void> => {
        const { channel } = req.validated.params;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const event = EventService.getIstance(channel);
        event.addClient(res);

        // Hearthbeat
        const keepAliveInterval = setInterval(() => res.write(': keep-alive\n\n'), 15000);

        req.on('close', () => {
            clearInterval(keepAliveInterval);
            event.removeClient(res);
        });
    })
}