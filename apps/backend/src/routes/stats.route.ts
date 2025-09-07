import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";
import { getFoodsStats, getOrdersStat, getRevenuePerDay } from "@/controllers/stats.controller";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OrdersStatResponse:
 *       type: object
 *       properties:
 *         totalOrders:
 *           type: integer
 *           description: Total number of orders
 *           example: 150
 *         ordersPerDay:
 *           type: array
 *           description: Daily breakdown of orders
 *           items:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *                 format: date
 *                 description: Date of the orders
 *                 example: "2025-08-13"
 *               count:
 *                 type: integer
 *                 description: Number of orders for that day
 *                 example: 25
 *     FoodStatsResponse:
 *       type: object
 *       properties:
 *         foodOrdered:
 *           type: array
 *           description: Statistics for each food item ordered
 *           items:
 *             type: object
 *             properties:
 *               food:
 *                 type: string
 *                 description: Name of the food item
 *                 example: "Pizza Margherita"
 *               quantity:
 *                 type: integer
 *                 description: Total quantity ordered
 *                 example: 45
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Total revenue for this food item
 *                 example: 450.00
 *     RevenueStatsResponse:
 *       type: object
 *       properties:
 *         revenuePerDay:
 *           type: array
 *           description: Daily revenue breakdown
 *           items:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *                 format: date
 *                 description: Date of the revenue
 *                 example: "2025-08-13"
 *               revenue:
 *                 type: number
 *                 format: float
 *                 description: Total revenue for that day
 *                 example: 1250.75
 */

/**
 * @openapi
 * /v1/stats/total-orders:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get total orders statistics
 *     description: Retrieve the total number of orders and daily breakdown of orders
 *     tags:
 *       - Stats
 *     responses:
 *       200:
 *         description: Orders statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrdersStatResponse'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get(
    '/total-orders',
    authenticate(["admin"]),
    getOrdersStat
)

/**
 * @openapi
 * /v1/stats/foods-ordered:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get food ordering statistics
 *     description: Retrieve statistics about food items ordered including quantities and total revenue per food
 *     tags:
 *       - Stats
 *     responses:
 *       200:
 *         description: Food statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoodStatsResponse'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get(
    '/foods-ordered',
    authenticate(["admin"]),
    getFoodsStats
)

/**
 * @openapi
 * /v1/stats/revenue:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get daily revenue statistics
 *     description: Retrieve daily breakdown of revenue generated from orders
 *     tags:
 *       - Stats
 *     responses:
 *       200:
 *         description: Revenue statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RevenueStatsResponse'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get(
    '/revenue',
    authenticate(["admin"]),
    getRevenuePerDay
)

export default router;