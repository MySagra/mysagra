import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";
import { StatsController } from "@/controllers/stats.controller";
import { StatsService } from "@/services/stats.service";

const statsController = new StatsController(new StatsService());

const router = Router();

router.get(
    '/total-orders',
    authenticate(["admin"]),
    statsController.getOrdersStats
)

router.get(
    '/foods-ordered',
    authenticate(["admin"]),
    statsController.getFoodsStats
)
router.get(
    '/revenue',
    authenticate(["admin"]),
    statsController.getRevenuePerDay
)

export default router;