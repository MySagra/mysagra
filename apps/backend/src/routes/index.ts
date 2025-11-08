import { Router } from "express";
import authRoutes from "./auth/auth.route";
import v1Routes from "./v1";
import eventRoutes from "./event"

import { authLimiter, apiLimiter } from "@/middlewares/rateLimiter.middleware";

const router = Router();

// Auth routes (without v1 prefix)
router.use("/auth", authLimiter, authRoutes);

// API v1 routes
router.use("/v1", apiLimiter, v1Routes);

// Event API (SSE - no compression)
router.use("/events", apiLimiter, eventRoutes)

export default router;