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
import apiKeysRouter from "@/modules/api-keys/api-keys.route"
import bannerRouter from "@/modules/banner/banner.route"
import { apiLimiter, authLimiter } from "./middlewares/rateLimiter.middleware";

const router = Router();

router.use("/auth", authLimiter, authRouter);
router.use("/events", apiLimiter, eventsRouter);

router.use("/v1/cash-registers", apiLimiter, cashRegistersRouter);
router.use("/v1/categories", apiLimiter, categoriesRouter);
router.use("/v1/foods", apiLimiter, foodsRouter);
router.use("/v1/ingredients", apiLimiter, ingredientsRouter);
router.use("/v1/orders", apiLimiter, ordersRouter);
router.use("/v1/printers", apiLimiter, printersRouter);
router.use("/v1/roles", apiLimiter, rolesRouter);
router.use("/v1/users", apiLimiter, usersRouter);
router.use("/v1/api-keys", apiLimiter, apiKeysRouter)
router.use("/v1/banners", apiLimiter, bannerRouter)

export default router;
