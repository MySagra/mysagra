import { Router } from "express";
import "./orders.docs";
import { authenticate } from "@/middlewares/authenticate";
import { validateRequest } from "@/middlewares/validateRequest";
import { 
    CreateOrderSchema, 
    GetOrdersQuerySchema, 
    ConfirmOrderSchema, 
    idParamSchema, 
    OrderIdParamSchema, 
    PatchOrderSchema, 
    ReprintOrderSchema 
} from "@mysagra/schemas";
import { OrdersController } from "@/modules/orders/orders.controller";
import { OrdersService } from "@/modules/orders/orders.service";
const orderController = new OrdersController(new OrdersService());
const router = Router();


router.get(
    "/",
    authenticate(["admin", "operator"]),
    validateRequest({
        query: GetOrdersQuerySchema
    }),
    orderController.getOrders
);

router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: OrderIdParamSchema
    }),
    orderController.getOrderById
)

router.post(
    "/",
    validateRequest({
        body: CreateOrderSchema
    }),
    orderController.createOrder
);

router.post(
    "/:id/confirm",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: idParamSchema,
        body: ConfirmOrderSchema
    }),
    orderController.confirmOrder
)

router.patch(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: idParamSchema,
        body: PatchOrderSchema
    }),
    orderController.patchOrder
)

router.delete(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: idParamSchema
    }),
    orderController.deleteOrder
);

router.post(
    "/:id/reprint",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: idParamSchema,
        body: ReprintOrderSchema
    }),
    orderController.reprintOrder
);
export default router;