import { Router } from "express";
import { getOrders, getOrderById, createOrder, deleteOrder, searchOrder, searchDailyOrder, getDailyOrders } from "@/controllers/order.controller";
import { validateRequest } from "@/middlewares/validateRequest";
import { createOrderSchema, updateOrderSchema, idOrderSchema } from "@/validators/order";
import { authenticate } from "@/middlewares/authenticate";
import { pageSchema } from "@/validators/page";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FoodOrdered:
 *       type: object
 *       properties:
 *         foodId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *     OrderResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           example: "A01"
 *         dateTime:
 *           type: string
 *           format: date-time
 *           example: "2025-08-13T10:30:00Z"
 *         table:
 *           type: integer
 *           minimum: 0
 *           example: 5
 *         customer:
 *           type: string
 *           example: "Mario Rossi"
 *         price:
 *           type: string
 *           format: float
 *           example: 25.50
 *         foodsOrdered:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FoodOrdered'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-08-13T10:30:00Z"
 *     OrderRequest:
 *       type: object
 *       required:
 *         - table
 *         - customer
 *         - foodsOrdered
 *       properties:
 *         table:
 *           type: integer
 *           minimum: 0
 *           example: 5
 *         customer:
 *           type: string
 *           minLength: 1
 *           example: "Mario Rossi"
 *         foodsOrdered:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - foodId
 *               - quantity
 *             properties:
 *               foodId:
 *                 type: integer
 *                 format: int64
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 */

/**
 * @openapi
 * /v1/orders/pages/{page}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get orders with pagination
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: page
 *         required: true
 *         description: Page number for pagination (0-based)
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Paginated list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderResponse'
 *       400:
 *         description: Invalid page parameter
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
    "/pages/:page",
    authenticate(["admin", "operator"]),
    validateRequest(pageSchema),
    getOrders
);

/**
 * @openapi
 * /v1/orders:
 *   post:
 *     summary: Create a new order
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       400:
 *         description: Invalid request body
 */
router.post(
    "/",
    validateRequest(createOrderSchema),
    createOrder
);

/**
 * @openapi
 * /v1/orders/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete an order
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the order to delete (3-character string)
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           example: "A01"
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       400:
 *         description: Invalid order ID parameter
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Order not found
 */
router.delete(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest(idOrderSchema),
    deleteOrder
);

/**
 * @openapi
 * /v1/orders/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get an order by ID
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the order to retrieve (3-character string)
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           example: "A01"
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       400:
 *         description: Invalid order ID parameter
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Order not found
 */
router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest(idOrderSchema),
    getOrderById
);

/**
 * @openapi
 * /v1/orders/search/daily/{value}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Search orders from today by value
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: value
 *         required: true
 *         description: Search value to filter today's orders
 *         schema:
 *           type: string
 *           example: "Mario"
 *     responses:
 *       200:
 *         description: List of today's orders matching the search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderResponse'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
    "/search/daily/:value",
    authenticate(["admin", "operator"]),
    searchDailyOrder
);

/**
 * @openapi
 * /v1/orders/search/{value}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Search all orders by value
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: value
 *         required: true
 *         description: Search value to filter orders
 *         schema:
 *           type: string
 *           example: "Mario"
 *     responses:
 *       200:
 *         description: List of orders matching the search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderResponse'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
    "/search/:value",
    authenticate(["admin"]),
    searchOrder
);

/**
 * @openapi
 * /v1/orders/day/today:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all orders from today
 *     tags:
 *       - Orders
 *     responses:
 *       200:
 *         description: List of today's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderResponse'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
    "/day/today",
    authenticate(["admin", "operator"]),
    getDailyOrders
);

export default router;