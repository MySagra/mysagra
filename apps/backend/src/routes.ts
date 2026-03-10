import { Router } from "express";

import authRouter from "@/modules/auth/auth.route";
import cashRegistersRouter from "@/modules/cash-registers/cash-registers.route";
import categoriesRouter from "@/modules/categories/categories.route";
import eventsRouter from "@/modules/events/events.route";
import foodsRouter from "@/modules/foods/foods.routes";
import ingredientsRouter from "@/modules/ingredients/ingredients.route";
import ordersRouter from "@/modules/orders/orders.route";
import printersRouter from "@/modules/printers/printers.route";
import rolesRouter from "@/modules/roles/roles.route";
import usersRouter from "@/modules/users/users.route";

const router = Router();

router.use("/auth", authRouter);
router.use("/events", eventsRouter);

router.use("/v1/cash-registers", cashRegistersRouter);
router.use("/v1/categories", categoriesRouter);
router.use("/v1/foods", foodsRouter);
router.use("/v1/ingredients", ingredientsRouter);
router.use("/v1/orders", ordersRouter);
router.use("/v1/printers", printersRouter);
router.use("/v1/roles", rolesRouter);
router.use("/v1/users", usersRouter);

export default router;
