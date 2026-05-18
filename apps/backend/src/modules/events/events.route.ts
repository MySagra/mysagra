import { Router } from "express";
import "./events.docs";
import { EventsController } from "@/modules/events/events.controller";
import { validateRequest } from "@/middlewares/validateRequest";
import { eventSchema } from "@mysagra/schemas";
import { authenticate } from "@/middlewares/authenticate";
import { env } from "@/config/env";
const eventController = new EventsController();
const router = Router();


router.get(
    '/:channel',
    authenticate(["admin", "maintainer", "operator"], ["ms_pt_"]),
    validateRequest({
        params: eventSchema
    }),
    eventController.handleSseConnection
)

if (env.NODE_ENV !== "production") {
    router.get(
        '/debug/destroy-connections/:channel/',
        authenticate(["admin"]),
        validateRequest({
            params: eventSchema
        }),
        eventController.destroyConnections
    )
}

export default router;