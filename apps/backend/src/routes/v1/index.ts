import { Router } from "express";
import categoryRoutes from "./category.route";
import foodRoutes from "./food.routes";
import orderRoutes from "./order.route";
import confirmOrderRoutes from "./confirmedOrder.routes"
import roleRoutes from "./role.route";
import statsRoutes from "./stats.route";
import userRoutes from "./user.route";
import ingredientRoutes from "./ingredient.route"
import eventRoutes from "./event.route"

const router = Router();

// Mount all routes
router.use("/categories", categoryRoutes);
router.use("/foods", foodRoutes);
router.use("/ingredients", ingredientRoutes);
router.use("/orders", orderRoutes);
router.use("/confirmed-orders", confirmOrderRoutes)
router.use("/roles", roleRoutes);
router.use("/stats", statsRoutes);
router.use("/users", userRoutes);
router.use("/events", eventRoutes);

export default router;