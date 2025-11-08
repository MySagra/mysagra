import { Router } from "express";
import eventRoutes from "./event.route"

const router = Router();
router.use("/", eventRoutes);

export default router;