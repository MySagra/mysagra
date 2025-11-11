import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";

import { validateRequest } from "@/middlewares/validateRequest";
import { orderSchema, orderCodeParamSchema, pageParamSchema, searchValueParamSchema, orderQuerySchema, cuidParamSchema, confirmedOrderSchema, idParamSchema } from "@/schemas";
import { OrderController } from "@/controllers/order.controller";
import { OrderService } from "@/services/order.service";
import { ConfirmedOrderService } from "@/services/confirmedOrder.service";

const orderController = new OrderController(new OrderService(), new ConfirmedOrderService());

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
 * /v1/orders/{id}/confirm:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Confirm an order
 *     description: |
 *       Confirms an existing order, assigns a daily progressive ticket number,
 *       recalculates the total and saves payment information.
 *       
 *       **Operational flow:**
 *       1. If orderItems are provided: deletes previous order items and recreates them with updated data
 *       2. If orderItems are not provided: uses existing order items without modification
 *       3. Generates a daily progressive ticket number
 *       4. Calculates the total (subtotal + surcharge - discount)
 *       5. Saves the confirmed order
 *       
 *       **Total calculation:**
 *       - Subtotal = Σ(quantity × price)
 *       - Total = Subtotal + surcharge - discount
 *       
 *       **orderItems parameter:**
 *       - Optional: if not provided, existing order items will be used
 *       - If provided: previous items will be deleted and replaced with the new ones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID to confirm
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 42
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *               - table
 *               - customer
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD]
 *                 description: Payment method
 *                 example: "CASH"
 *               discount:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Applied discount (optional)
 *                 example: 5.00
 *               surcharge:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Applied surcharge (optional)
 *                 example: 2.00
 *               table:
 *                 type: string
 *                 minLength: 1
 *                 description: Table number or identifier
 *                 example: "5"
 *               customer:
 *                 type: string
 *                 minLength: 1
 *                 description: Customer name
 *                 example: "Mario Rossi"
 *               orderItems:
 *                 type: array
 *                 description: List of order items (optional - if not provided, existing items will be used)
 *                 items:
 *                   type: object
 *                   required:
 *                     - foodId
 *                     - quantity
 *                   properties:
 *                     foodId:
 *                       type: string
 *                       format: cuid
 *                       description: Food item ID
 *                       example: "clm1234567890"
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Ordered quantity
 *                       example: 2
 *                     notes:
 *                       type: string
 *                       description: Special notes for the order item (optional)
 *                       example: "No tomatoes"
 *           examples:
 *             orderWithDiscount:
 *               summary: Order with discount
 *               value:
 *                 paymentMethod: "CASH"
 *                 discount: 5.00
 *                 surcharge: 2.00
 *                 table: "5"
 *                 customer: "Mario Rossi"
 *                 orderItems:
 *                   - foodId: "clm1234567890"
 *                     quantity: 2
 *                   - foodId: "clm9876543210"
 *                     quantity: 1
 *                     notes: "No onions"
 *             orderWithSurcharge:
 *               summary: Order with surcharge
 *               value:
 *                 paymentMethod: "CARD"
 *                 surcharge: 2.00
 *                 table: "12"
 *                 customer: "Laura Bianchi"
 *                 orderItems:
 *                   - foodId: "clm1234567890"
 *                     quantity: 3
 *     responses:
 *       201:
 *         description: Order confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Confirmed order ID
 *                   example: "clm9876543210"
 *                 orderId:
 *                   type: integer
 *                   description: Original order ID
 *                   example: 42
 *                 ticketNumber:
 *                   type: integer
 *                   nullable: true
 *                   description: Daily ticket number
 *                   example: 15
 *                 status:
 *                   type: string
 *                   enum: [CONFIRMED, COMPLETED, PICKED_UP]
 *                   description: Confirmed order status
 *                   example: "CONFIRMED"
 *                 paymentMethod:
 *                   type: string
 *                   enum: [CASH, CARD]
 *                   description: Payment method
 *                   example: "CASH"
 *                 discount:
 *                   type: number
 *                   format: decimal
 *                   description: Applied discount
 *                   example: 5.00
 *                 surcharge:
 *                   type: number
 *                   format: decimal
 *                   description: Applied surcharge
 *                   example: 2.00
 *                 total:
 *                   type: number
 *                   format: decimal
 *                   description: Order total (subtotal + surcharge - discount)
 *                   example: 47.00
 *                 confirmedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Order confirmation date and time
 *                   example: "2025-11-05T14:30:00.000Z"
 *             example:
 *               id: "clm9876543210"
 *               orderId: 42
 *               ticketNumber: 15
 *               status: "CONFIRMED"
 *               paymentMethod: "CASH"
 *               discount: 5.00
 *               surcharge: 2.00
 *               total: 47.00
 *               confirmedAt: "2025-11-05T14:30:00.000Z"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *             examples:
 *               invalidOrderId:
 *                 summary: Invalid order ID
 *                 value:
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "id"
 *                       message: "Order ID must be a positive integer"
 *               missingPaymentMethod:
 *                 summary: Missing payment method
 *                 value:
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "paymentMethod"
 *                       message: "Payment method is required"
 *               emptyOrderItems:
 *                 summary: No items in order
 *                 value:
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "orderItems"
 *                       message: "Order must contain at least one item"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Access denied - operators and administrators only
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden - Insufficient permissions"
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Order not found"
 *             example:
 *               error: "Order not found"
 *       409:
 *         description: Conflict - Order already confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Order already confirmed"
 *             example:
 *               error: "Order already confirmed"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server error"
 *             example:
 *               error: "Server error"
 */
router.post(
    "/:id/confirm",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: idParamSchema,
        body: confirmedOrderSchema
    }),
    orderController.confirmOrder
)

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