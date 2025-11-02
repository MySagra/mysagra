import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";

import { validateBody, validateParams } from "@/middlewares/validateRequest";
import { orderSchema, orderIdParamSchema, pageParamSchema } from "@/validators";
import { OrderController } from "@/controllers/order.controller";
import { OrderService } from "@/services/order.service";

const orderController = new OrderController(new OrderService());

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FoodInOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clx1a2b3c4d5e6f7g8h9i0j1"
 *         name:
 *           type: string
 *           example: "Pizza Margherita"
 *         description:
 *           type: string
 *           example: "Classic pizza with tomato and mozzarella"
 *         price:
 *           type: string
 *           example: "8.50"
 *         available:
 *           type: boolean
 *           example: true
 *         category:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             name:
 *               type: string
 *               example: "Pizza"
 *         foodIngredients:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               ingredient:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "clm1234567890"
 *                   name:
 *                     type: string
 *                     example: "Mozzarella"
 *     FoodOrdered:
 *       type: object
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         food:
 *           $ref: '#/components/schemas/FoodInOrder'
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
 *                 type: string
 *                 example: "clx1a2b3c4d5e6f7g8h9i0j1"
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
    validateParams(pageParamSchema),
    orderController.getOrders
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
    validateBody(orderSchema),
    orderController.createOrder
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
 *       204:
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
    validateParams(orderIdParamSchema),
    orderController.deleteOrder
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
    validateParams(orderIdParamSchema),
    orderController.getOrderById
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
    orderController.searchDailyOrder
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
    orderController.searchOrder
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
    orderController.getDailyOrders
);

export default router;