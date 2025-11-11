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
 * /v1/orders:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get orders with advanced filtering and pagination
 *     description: |
 *       Returns a paginated and filtered list of orders with basic information only. 
 *       Use GET /{code} to retrieve full order details including items, categories and ingredients.
 *       
 *       **Filtering options:**
 *       - Search by customer name, table or order code
 *       - Filter by confirmation status (confirmed/unconfirmed)
 *       - Filter by order status (CONFIRMED, COMPLETED, PICKED_UP)
 *       - Filter by date range
 *       
 *       **Important notes:**
 *       - Cannot filter by 'status' when 'confirmed' is false (unconfirmed orders don't have status)
 *       - Multiple statuses can be provided (e.g., status=CONFIRMED&status=COMPLETED)
 *       - Date filters use inclusive ranges
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         description: Search by customer name, table number, or order code
 *         schema:
 *           type: string
 *           example: "Mario"
 *       - in: query
 *         name: confirmed
 *         required: false
 *         description: Filter by confirmation status (true = confirmed orders, false = unconfirmed orders)
 *         schema:
 *           type: boolean
 *           example: true
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number for pagination (1-based)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of items per page (max 100)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           example: 20
 *       - in: query
 *         name: sortBy
 *         required: false
 *         description: Field to sort by
 *         schema:
 *           type: string
 *           enum: [createdAt]
 *           default: createdAt
 *           example: createdAt
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter by order status (can be used multiple times for multiple statuses). Cannot be used when confirmed=false. Leave empty to show all statuses.
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [CONFIRMED, COMPLETED, PICKED_UP]
 *         style: form
 *         explode: true
 *         example: 
 *          -   CONFIRMED
 *       - in: query
 *         name: dateFrom
 *         required: false
 *         description: Start date for date range filter (inclusive). Click to open date picker.
 *         schema:
 *           type: string
 *           format: date-time
 *         example: "2025-11-01T00:00:00Z"
 *       - in: query
 *         name: dateTo
 *         required: false
 *         description: End date for date range filter (inclusive). Click to open date picker.
 *         schema:
 *           type: string
 *           format: date-time
 *         example: "2025-11-30T23:59:59Z"
 *     responses:
 *       200:
 *         description: Paginated and filtered list of orders
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
 *                       example: 20
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
 *         description: Invalid query parameters or validation error (e.g., using status filter with confirmed=false)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["You cannot filter by 'status' when 'confirmed' is 'false'"]
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
    "/",
    authenticate(["admin", "operator"]),
    validateRequest({
        query: orderQuerySchema
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

export default router;