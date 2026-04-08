import { Router } from "express";
import "./order-instruction.docs";
import { authenticate } from "@/middlewares/authenticate";
import { CreateOrderInstructionSchema, UpdateOrderInstructionSchema, cuidParamSchema } from "@mysagra/schemas";
import { validateRequest } from "@/middlewares/validateRequest";

import { OrderInstructionsController } from "./order-instruction.controller";
import { OrderInstructionsService } from "./order-instructions.service";

const orderInstructionsController = new OrderInstructionsController(new OrderInstructionsService())
const router = Router();

router.get(
    "/",
    authenticate(["admin", "maintainer", "operator"], ["ms_wb_"]),
    orderInstructionsController.getOrderInstructions
)

router.get(
    "/:id",
    authenticate(["admin", "maintainer", "operator"], ["ms_wb_"]),
    validateRequest({
        params: cuidParamSchema
    }),
    orderInstructionsController.getOrderInstruction
)

router.post(
    "/",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        body: CreateOrderInstructionSchema
    }),
    orderInstructionsController.createOrderInstruction
)

router.put(
    "/:id",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        params: cuidParamSchema,
        body: UpdateOrderInstructionSchema
    }),
    orderInstructionsController.updateOrderInstruction
)

router.delete(
    "/:id",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        params: cuidParamSchema
    }),
    orderInstructionsController.deleteOrderInstruction
)

export default router;
