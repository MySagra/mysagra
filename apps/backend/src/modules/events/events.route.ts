import { Router } from "express";
import "./events.docs";
import { EventsController } from "@/modules/events/events.controller";
import { validateRequest } from "@/middlewares/validateRequest";
import { eventSchema } from "@mysagra/schemas";
import { authenticate } from "@/middlewares/authenticate";
const eventController = new EventsController();
const router = Router();


router.get(
    '/:channel',
    authenticate(["admin", "operator"]),
    validateRequest({
        params: eventSchema
    }),
    eventController.handleSseConnection
)
export default router;