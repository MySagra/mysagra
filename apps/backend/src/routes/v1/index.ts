import { Router } from "express";
import categoryRoutes from "./category.route";
import foodRoutes from "./food.routes";
import orderRoutes from "./order.route";
import roleRoutes from "./role.route";
//import statsRoutes from "./stats.route";
import userRoutes from "./user.route";
import ingredientRoutes from "./ingredient.route"
import cashRegisterRoutes from "./cash-register.route"
import printerRoutes from "./printer.route"

const router = Router();

// Mount all routes
router.use("/categories", categoryRoutes);
router.use("/foods", foodRoutes);
router.use("/ingredients", ingredientRoutes);
router.use("/orders", orderRoutes);
router.use("/roles", roleRoutes);
//router.use("/stats", statsRoutes);
router.use("/users", userRoutes);
router.use("/cash-registers", cashRegisterRoutes);
router.use("/printers", printerRoutes);

export default router;