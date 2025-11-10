import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";

import { validateRequest } from "@/middlewares/validateRequest";
import { orderSchema, orderCodeParamSchema, pageParamSchema, searchValueParamSchema, orderQuerySchema } from "@/schemas";
import { OrderController } from "@/controllers/order.controller";
import { OrderService } from "@/services/order.service";

const orderController = new OrderController(new OrderService());

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Pizza"
 *     Ingredient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clm1234567890"
 *         name:
 *           type: string
 *           example: "Mozzarella"
 *     FoodBasic:
 *       type: object
 *       description: Basic food info returned in order creation
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
 *     FoodDetailed:
 *       type: object
 *       description: Detailed food info with category and ingredients
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
 *           $ref: '#/components/schemas/Category'
 *         foodIngredients:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               ingredient:
 *                 $ref: '#/components/schemas/Ingredient'
 *     OrderItemBasic:
 *       type: object
 *       description: Order item with basic food info
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         notes:
 *           type: string
 *           description: Optional notes for this specific item
 *           example: "No onions, extra cheese"
 *         food:
 *           $ref: '#/components/schemas/FoodBasic'
 *     OrderItemDetailed:
 *       type: object
 *       description: Order item with detailed food info, category and ingredients
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         notes:
 *           type: string
 *           description: Optional notes for this specific item
 *           example: "No onions, extra cheese"
 *         food:
 *           $ref: '#/components/schemas/FoodDetailed'
 *     OrderListResponse:
 *       type: object
 *       description: Lightweight order object for list/search endpoints (no items details)
 *       properties:
 *         id:
 *           type: string
 *           example: "clx1a2b3c4d5e6f7g8h9i0j1"
 *         displayCode:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           example: "A01"
 *         table:
 *           type: string
 *           example: "5"
 *         customer:
 *           type: string
 *           example: "Mario Rossi"
 *         subTotal:
 *           type: string
 *           example: "25.50"
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *           example: "pending"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-04T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-04T10:30:00Z"
 *     CategoryBasic:
 *       type: object
 *       description: Basic category with only id and name
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Pizza"
 *     FoodWithIngredients:
 *       type: object
 *       description: Food with flat ingredients array
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
 *         ingredients:
 *           type: array
 *           description: Flat array of ingredients
 *           items:
 *             $ref: '#/components/schemas/Ingredient'
 *     CategorizedOrderItem:
 *       type: object
 *       description: Order item with food and flat ingredients
 *       properties:
 *         id:
 *           type: string
 *           example: "clx9876543210"
 *         quantity:
 *           type: integer
 *           example: 2
 *         notes:
 *           type: string
 *           nullable: true
 *           description: Optional notes for this specific item
 *           example: "No onions, extra cheese"
 *         food:
 *           $ref: '#/components/schemas/FoodWithIngredients'
 *     CategorizedItems:
 *       type: object
 *       description: Items grouped by category
 *       properties:
 *         category:
 *           $ref: '#/components/schemas/CategoryBasic'
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategorizedOrderItem'
 *     OrderDetailResponse:
 *       type: object
 *       description: Complete order object with items grouped by category and flat ingredients array
 *       properties:
 *         id:
 *           type: number
 *           example: 23
 *         displayCode:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           example: "A01"
 *         table:
 *           type: string
 *           example: "5"
 *         customer:
 *           type: string
 *           example: "Mario Rossi"
 *         subTotal:
 *           type: string
 *           example: "25.50"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-04T10:30:00Z"
 *         categorizedItems:
 *           type: array
 *           description: Order items grouped by food category
 *           items:
 *             $ref: '#/components/schemas/CategorizedItems'
 *     OrderCreateResponse:
 *       type: object
 *       description: Order response after creation (lightweight, no food details)
 *       properties:
 *         id:
 *           type: string
 *           example: "clx1a2b3c4d5e6f7g8h9i0j1"
 *         displayCode:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           example: "A01"
 *         table:
 *           type: string
 *           example: "5"
 *         customer:
 *           type: string
 *           example: "Mario Rossi"
 *         subTotal:
 *           type: string
 *           example: "25.50"
 *         status:
 *           type: string
 *           example: "pending"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-04T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-11-04T10:30:00Z"
 *         orderItems:
 *           type: boolean
 *           description: Always true, indicates order items were created
 *           example: true
 *     OrderRequest:
 *       type: object
 *       required:
 *         - table
 *         - customer
 *         - orderItems
 *       properties:
 *         table:
 *           type: string
 *           minLength: 1
 *           example: "5"
 *         customer:
 *           type: string
 *           minLength: 1
 *           example: "Mario Rossi"
 *         orderItems:
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
 *               notes:
 *                 type: string
 *                 description: Optional notes for this specific item (e.g., dietary restrictions, preferences)
 *                 example: "No onions, extra cheese"
 */

/**
 * @openapi
 * /v1/orders/pages/{page}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get orders with pagination (lightweight - no items details)
 *     description: Returns a paginated list of orders with basic information only. Use GET /{code} to retrieve full order details including items, categories and ingredients.
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: page
 *         required: true
 *         description: Page number for pagination (1-based, 21 items per page)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Paginated list of orders (basic info only)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderListResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalOrdersPages:
 *                       type: integer
 *                       example: 5
 *                     totalOrdersItems:
 *                       type: integer
 *                       example: 100
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 21
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *                     nextPage:
 *                       type: integer
 *                       nullable: true
 *                       example: 2
 *                     prevPage:
 *                       type: integer
 *                       nullable: true
 *                       example: null
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
    validateRequest({
        params: pageParamSchema
    }),
    orderController.getOrders
);

/**
 * @openapi
 * /v1/orders:
 *   post:
 *     summary: Create a new order
 *     description: Creates a new order with items. Returns the created order without food details (lightweight response). Price is automatically calculated from food items. Use GET /{code} to retrieve full order details.
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
 *         description: Order created successfully (lightweight, no food details)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderCreateResponse'
 *       400:
 *         description: Invalid request body or food items not found
 */
router.post(
    "/",
    validateRequest({
        body: orderSchema
    }),
    orderController.createOrder
);

/**
 * @openapi
 * /v1/orders/{code}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete an order
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         description: Code of the order to delete (3-character string)
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           example: "A01"
 *     responses:
 *       204:
 *         description: Order deleted successfully
 *       400:
 *         description: Invalid order code parameter
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Order not found
 */
router.delete(
    "/:code",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: orderCodeParamSchema
    }),
    orderController.deleteOrder
);

/**
 * @openapi
 * /v1/orders/{code}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get complete order details by code
 *     description: Returns full order information with items grouped by category. Each food item includes a flat ingredients array (not nested). Categories contain only id and name. Optimized for detailed order views.
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         description: Display code of the order (3-character string, e.g., "A01")
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           example: "A01"
 *     responses:
 *       200:
 *         description: Complete order details with items, categories and ingredients
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderDetailResponse'
 *       400:
 *         description: Invalid order code parameter
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Order not found
 */
router.get(
    "/:code",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: orderCodeParamSchema
    }),
    orderController.getOrderById
);

/**
 * @openapi
 * /v1/orders/search/daily/{value}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Search today's orders (lightweight - no items details)
 *     description: Search orders created today by display code, table number, or customer name. Returns basic order info only.
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: value
 *         required: true
 *         description: Search value (display code, table number, or customer name)
 *         schema:
 *           type: string
 *           example: "Mario"
 *     responses:
 *       200:
 *         description: List of today's orders matching the search criteria (basic info only)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderListResponse'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
    "/search/daily/:value",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: searchValueParamSchema
    }),
    orderController.searchDailyOrder
);

/**
 * @openapi
 * /v1/orders/search/{value}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Search all orders (lightweight - no items details)
 *     description: Search all orders in the database by display code, table number, or customer name. Returns basic order info only. Admin only.
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: value
 *         required: true
 *         description: Search value (display code, table number, or customer name)
 *         schema:
 *           type: string
 *           example: "Mario"
 *     responses:
 *       200:
 *         description: List of all orders matching the search criteria (basic info only)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderListResponse'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
    "/search/:value",
    authenticate(["admin"]),
    validateRequest({
        params: searchValueParamSchema
    }),
    orderController.searchOrder
);

/**
 * @openapi
 * /v1/orders/day/today:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all today's orders (lightweight - no items details)
 *     description: |
 *       Returns all orders created today with basic information only. Orders are sorted by creation date (newest first).
 *       
 *       **Optional filtering:**
 *       - Use `exclude=confirmed` to exclude confirmed orders from the results
 *       - Without `exclude` parameter: returns all today's orders (including confirmed ones)
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: query
 *         name: exclude
 *         required: false
 *         description: Exclude orders by status (use 'confirmed' to exclude confirmed orders)
 *         schema:
 *           type: string
 *           enum: [confirmed]
 *         example: confirmed
 *     responses:
 *       200:
 *         description: List of today's orders (basic info only)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderListResponse'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
    "/day/today",
    authenticate(["admin", "operator"]),
    validateRequest({
        query: orderQuerySchema
    }),
    orderController.getDailyOrders
);

export default router;