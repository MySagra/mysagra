import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";

import { validateRequest } from "@/middlewares/validateRequest";
import { CreateOrderSchema, GetOrdersQuerySchema, ConfirmOrderSchema, idParamSchema, OrderIdParamSchema, PatchOrderSchema } from "@/schemas";
import { OrderController } from "@/controllers/order.controller";
import { OrderService } from "@/services/order.service";

const orderController = new OrderController(new OrderService());

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *       required:
 *         - error
 *     OrderItemInput:
 *       type: object
 *       required:
 *         - foodId
 *         - quantity
 *       properties:
 *         foodId:
 *           type: string
 *           format: cuid
 *           description: Food item ID
 *           example: "clx1a2b3c4d5e6f7g8h9i0j1"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity to order
 *           example: 2
 *         notes:
 *           type: string
 *           description: Optional notes for this specific item
 *           example: "No onions, extra cheese"
 *         surcharge:
 *           type: number
 *           format: float
 *           default: 0
 *           description: Surcharge for this item (e.g., extra toppings)
 *           example: 1.50
 *         unitPrice:
 *           type: number
 *           format: float
 *           description: Unit price of the food item (set automatically by backend)
 *           example: 8.50
 *         total:
 *           type: number
 *           format: float
 *           description: Total for this item (surcharge + unitPrice * quantity, set automatically by backend)
 *           example: 18.50
 *     ConfirmationData:
 *       type: object
 *       required:
 *         - paymentMethod
 *       properties:
 *         userId: 
 *           type: string
 *           format: cuid
 *           description: User ID who confirmed the order
 *           example: "clx1a2b3c4d5e6f7g8h9i0j1"
 *         cashRegisterId:
 *           type: string
 *           format: cuid
 *           description: Cash register ID where the order was confirmed
 *         paymentMethod:
 *           type: string
 *           enum: [CASH, CARD]
 *           description: Payment method used by the customer
 *           example: "CASH"
 *         discount:
 *           type: number
 *           format: float
 *           minimum: 0
 *           default: 0
 *           description: Discount amount to subtract from subtotal
 *           example: 2.50
 *         orderItems:
 *           type: array
 *           description: Optional list of order items to replace existing ones
 *           items:
 *             $ref: '#/components/schemas/OrderItemInput'
 *     OrderStatus:
 *       type: string
 *       enum: [PENDING, CONFIRMED, COMPLETED, PICKED_UP]
 *       description: Order status in the lifecycle
 *     OrderBase:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Order ID
 *           example: 42
 *         displayCode:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           description: 3-character alphanumeric order code
 *           example: "A01"
 *         table:
 *           type: string
 *           description: Table number or identifier
 *           example: "5"
 *         customer:
 *           type: string
 *           description: Customer name
 *           example: "Mario Rossi"
 *         status:
 *           $ref: '#/components/schemas/OrderStatus'
 *         subTotal:
 *           type: number
 *           format: decimal
 *           description: Subtotal before discount/surcharge
 *           example: 50.00
 *         total:
 *           type: number
 *           format: decimal
 *           description: Final total amount
 *           example: 47.00
 *         discount:
 *           type: number
 *           format: decimal
 *           description: Applied discount
 *           example: 5.00
 *         surcharge:
 *           type: number
 *           format: decimal
 *           description: Applied surcharge
 *           example: 2.00
 *         paymentMethod:
 *           type: string
 *           enum: [CASH, CARD]
 *           nullable: true
 *           description: Payment method (null for PENDING orders)
 *           example: "CASH"
 *         ticketNumber:
 *           type: integer
 *           nullable: true
 *           description: Daily progressive ticket number (null for PENDING orders)
 *           example: 15
 *         confirmedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Order confirmation timestamp
 *           example: "2025-11-12T14:30:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *           example: "2025-11-12T14:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2025-11-12T14:30:00.000Z"
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
 *         unitPrice:
 *           type: number
 *           format: decimal
 *           description: Unit price of the food at time of order
 *           example: 8.50
 *         unitSurcharge:
 *           type: number
 *           format: decimal
 *           description: Per-unit surcharge (item surcharge / quantity)
 *           example: 0.75
 *         total:
 *           type: number
 *           format: decimal
 *           description: Total for this item (surcharge + unitPrice * quantity)
 *           example: 18.50
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
 *         unitPrice:
 *           type: number
 *           format: decimal
 *           description: Unit price of the food at time of order
 *           example: 8.50
 *         unitSurcharge:
 *           type: number
 *           format: decimal
 *           description: Per-unit surcharge (item surcharge / quantity)
 *           example: 0.75
 *         total:
 *           type: number
 *           format: decimal
 *           description: Total for this item (surcharge + unitPrice * quantity)
 *           example: 18.50
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
 *         unitPrice:
 *           type: number
 *           format: decimal
 *           description: Unit price of the food at time of order
 *           example: 8.50
 *         unitSurcharge:
 *           type: number
 *           format: decimal
 *           description: Per-unit surcharge (item surcharge / quantity)
 *           example: 0.75
 *         total:
 *           type: number
 *           format: decimal
 *           description: Total for this item (surcharge + unitPrice * quantity)
 *           example: 18.50
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
 *           description: Table number or identifier
 *           example: "5"
 *         customer:
 *           type: string
 *           minLength: 1
 *           description: Customer name
 *           example: "Mario Rossi"
 *         orderItems:
 *           type: array
 *           minItems: 1
 *           description: List of items in the order
 *           items:
 *             $ref: '#/components/schemas/OrderItemInput'
 *         confirm:
 *           allOf:
 *             - $ref: '#/components/schemas/ConfirmationData'
 *             - type: object
 *               description: |
 *                 Optional confirmation data. If provided, the order will be created in CONFIRMED status.
 *                 If omitted, the order will be created in PENDING status.
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
 *       - Filter by order status (PENDING, CONFIRMED, COMPLETED, PICKED_UP)
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
 *         name: displayCode
 *         required: false
 *         description: Filter by orderCode
 *         schema:
 *           type: string
 *           example: "A01"
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
 *             enum: [PENDING, CONFIRMED, COMPLETED, PICKED_UP]
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
        query: GetOrdersQuerySchema
    }),
    orderController.getOrders
);

/**
 * @openapi
 * /v1/orders/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get order details by ID
 *     description: |
 *       Retrieves complete order details by its numeric ID, including all items grouped by category
 *       with full food information and ingredients.
 *       
 *       **Response structure:**
 *       - Order items are grouped by food category for better organization
 *       - Each food item includes its full details (name, description, price, availability)
 *       - Ingredients are provided as a flat array (not nested in foodIngredients)
 *       - Includes all order information (payment details, status, ticket number if confirmed)
 *       
 *       **Use cases:**
 *       - Display order details in the cashier interface
 *       - Show order items grouped by category for kitchen preparation
 *       - Retrieve order for confirmation or modification
 *       
 *       **Authentication:** Requires bearer token (admin or operator role).
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric order ID
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 42
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderDetailResponse'
 *             example:
 *               id: 42
 *               displayCode: "A01"
 *               table: "5"
 *               customer: "Mario Rossi"
 *               subTotal: "25.50"
 *               createdAt: "2025-11-12T10:30:00.000Z"
 *               categorizedItems:
 *                 - category:
 *                     id: 1
 *                     name: "Pizza"
 *                   items:
 *                     - id: "clm1234567890"
 *                       quantity: 2
 *                       notes: "No onions, extra cheese"
 *                       food:
 *                         id: "clx1a2b3c4d5e6f7g8h9i0j1"
 *                         name: "Pizza Margherita"
 *                         description: "Classic pizza with tomato and mozzarella"
 *                         price: "8.50"
 *                         ingredients:
 *                           - id: "clm111"
 *                             name: "Mozzarella"
 *                           - id: "clm222"
 *                             name: "Tomato Sauce"
 *                 - category:
 *                     id: 2
 *                     name: "Drinks"
 *                   items:
 *                     - id: "clm9876543210"
 *                       quantity: 1
 *                       notes: null
 *                       food:
 *                         id: "clx9z8y7x6w5v4u3t2s1r0q9"
 *                         name: "Coca Cola"
 *                         description: "330ml can"
 *                         price: "2.50"
 *                         ingredients: []
 *       400:
 *         description: Invalid order ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Order ID must be a positive integer"
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Order not found"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: OrderIdParamSchema
    }),
    orderController.getOrderById
)

/**
 * @openapi
 * /v1/orders:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new order (with or without immediate confirmation)
 *     description: |
 *       Creates a new order with items. This endpoint supports two operational modes:
 *       
 *       **1. Create PENDING order (without confirmation data):**
 *       - Creates an order in PENDING status
 *       - The order is NOT locked and can be accessed by any client
 *       - No ticket number is assigned yet
 *       - No payment information is stored
 *       - Useful for orders that need to be reviewed before payment
 *       
 *       **2. Create and CONFIRM order (with confirmation data):**
 *       - Creates an order and immediately confirms it
 *       - Status is set to CONFIRMED
 *       - A daily progressive ticket number is assigned
 *       - Payment information is stored
 *       - Total is calculated: subtotal + surcharge - discount
 *       - Broadcasts confirmation event to displays
 *       
 *       **Price calculation:**
 *       - Each item total: surcharge + (unitPrice × quantity)
 *       - Subtotal = Σ(item.total)
 *       - Order surcharge = Σ(item.surcharge)
 *       - If confirm data is provided: Total = Subtotal - discount
 *       
 *       **Note:** Returns lightweight response without food details. Use GET /{id} to retrieve full order details.
 *       
 *       **Authentication:** Requires bearer token (admin or operator role).
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderRequest'
 *           examples:
 *             withConfirmation:
 *               summary: Create and confirm order (recommended)
 *               description: Creates an order and immediately confirms it with payment information
 *               value:
 *                 table: "5"
 *                 customer: "Mario Rossi"
 *                 orderItems:
 *                   - foodId: "clx1a2b3c4d5e6f7g8h9i0j1"
 *                     quantity: 2
 *                     notes: "No onions, extra cheese"
 *                     surcharge: 1.50
 *                   - foodId: "clx9z8y7x6w5v4u3t2s1r0q9"
 *                     quantity: 1
 *                     notes: "Well done"
 *                     surcharge: 0
 *                 confirm:
 *                   paymentMethod: "CASH"
 *                   discount: 2.50
 *                   userId: "clx1a2b3c4d5e6f7g8h9i0j1"
 *                   cashRegisterId: "clx9z8y7x6w5v4u3t2s1r0q9"
 *             withoutConfirmation:
 *               summary: Create pending order (no authentication required)
 *               description: Creates a PENDING order without payment info - accessible by all clients
 *               value:
 *                 table: "5"
 *                 customer: "Mario Rossi"
 *                 orderItems:
 *                   - foodId: "clx1a2b3c4d5e6f7g8h9i0j1"
 *                     quantity: 2
 *                     notes: "No onions, extra cheese"
 *                     surcharge: 0
 *                   - foodId: "clx9z8y7x6w5v4u3t2s1r0q9"
 *                     quantity: 1
 *                     surcharge: 0
 *     responses:
 *       201:
 *         description: Order created successfully (lightweight, no food details)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderCreateResponse'
 *             examples:
 *               confirmed:
 *                 summary: Confirmed order response
 *                 value:
 *                   id: "clx1a2b3c4d5e6f7g8h9i0j1"
 *                   displayCode: "A01"
 *                   table: "5"
 *                   customer: "Mario Rossi"
 *                   subTotal: "25.50"
 *                   total: "24.00"
 *                   discount: 2.50
 *                   surcharge: 1.00
 *                   paymentMethod: "CASH"
 *                   status: "CONFIRMED"
 *                   ticketNumber: 42
 *                   confirmedAt: "2025-11-12T10:30:00Z"
 *                   createdAt: "2025-11-12T10:30:00Z"
 *                   updatedAt: "2025-11-12T10:30:00Z"
 *                   orderItems: true
 *               pending:
 *                 summary: Pending order response
 *                 value:
 *                   id: "clx1a2b3c4d5e6f7g8h9i0j1"
 *                   displayCode: "A01"
 *                   table: "5"
 *                   customer: "Mario Rossi"
 *                   subTotal: "25.50"
 *                   total: "25.50"
 *                   discount: 0
 *                   surcharge: 0
 *                   paymentMethod: null
 *                   status: "PENDING"
 *                   ticketNumber: null
 *                   confirmedAt: null
 *                   createdAt: "2025-11-12T10:30:00Z"
*                   updatedAt: "2025-11-12T10:30:00.000Z"
 *                   orderItems: true
 *       400:
 *         description: Invalid request body or food items not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "One or more requested products do not exist or are invalid"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
    "/",
    validateRequest({
        body: CreateOrderSchema
    }),
    orderController.createOrder
);

/**
 * @openapi
 * /v1/orders/{id}/confirm:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Confirm a PENDING order
 *     description: |
 *       Confirms an existing PENDING order by assigning a daily progressive ticket number,
 *       calculating the final total with discounts/surcharges, and storing payment information.
 *       
 *       **Use cases:**
 *       - Confirm an order that was previously created in PENDING status
 *       - Optionally modify order items before confirmation
 *       - Apply discounts or surcharges to the final total
 *       
 *       **Operational flow:**
 *       1. Validates that the order exists and is in PENDING status
 *       2. **Order Items Management:**
 *          - If `orderItems` is provided: replaces all existing items with the new ones
 *          - If `orderItems` is omitted: keeps existing items unchanged
 *       3. Recalculates subtotal based on current/new items
 *       4. Applies discount and surcharge to calculate final total
 *       5. Assigns a daily progressive ticket number (resets daily at noon)
 *       6. Updates order status to CONFIRMED
 *       7. Broadcasts confirmation event to display systems
 *       
 *       **Total calculation:**
 *       - Each item total: surcharge + (unitPrice × quantity)
 *       - Subtotal = Σ(item.total)
 *       - Order surcharge = Σ(item.surcharge)
 *       - Total = Subtotal - discount
 *       - If total becomes negative, it's set to 0
 *       
 *       **Important notes:**
 *       - Only PENDING orders can be confirmed
 *       - Ticket numbers are progressive and reset daily at 12:00 PM
 *       - If orderItems are provided, they must reference available food items
 *       - The confirmation cannot be undone
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID to confirm (must be in PENDING status)
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 42
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ConfirmationData'
 *               - type: object
 *                 description: |
 *                   Confirmation data with optional orderItems.
 *                   If orderItems is omitted, existing items will be kept unchanged.
 *                   If provided, all previous items will be deleted and replaced.
 *           examples:
 *             withNewItems:
 *               summary: Confirm with modified items
 *               description: Replaces existing items and confirms the order
 *               value:
 *                 userId: "clx1a2b3c4d5e6f7g8h9i0j1"
 *                 cashRegisterId: "clx9z8y7x6w5v4u3t2s1r0q9"
 *                 paymentMethod: "CASH"
 *                 discount: 5.00
 *                 orderItems:
 *                   - foodId: "clm1234567890"
 *                     quantity: 2
 *                     notes: "Extra spicy"
 *                     surcharge: 1.50
 *                   - foodId: "clm9876543210"
 *                     quantity: 1
 *                     notes: "No onions"
 *                     surcharge: 0
 *             withoutNewItems:
 *               summary: Confirm with existing items
 *               description: Keeps existing items and only adds payment info
 *               value:
 *                 paymentMethod: "CARD"
 *                 discount: 0
 *             withDiscountOnly:
 *               summary: Confirm with discount only
 *               value:
 *                 paymentMethod: "CASH"
 *                 discount: 10.00
 *     responses:
 *       200:
 *         description: Order confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OrderBase'
 *                 - type: object
 *                   properties:
 *                     orderItems:
 *                       type: array
 *                       description: Order items (basic info without food details)
 *                       items:
 *                         type: object
 *             examples:
 *               confirmed:
 *                 summary: Successfully confirmed order
 *                 value:
 *                   id: 42
 *                   userId: "clx1a2b3c4d5e6f7g8h9i0j1"
 *                   cashRegisterId: "clx9z8y7x6w5v4u3t2s1r0q9"
 *                   displayCode: "A01"
 *                   table: "5"
 *                   customer: "Mario Rossi"
 *                   ticketNumber: 15
 *                   status: "CONFIRMED"
 *                   paymentMethod: "CASH"
 *                   discount: 5.00
 *                   surcharge: 2.00
 *                   subTotal: 50.00
 *                   total: 47.00
 *                   confirmedAt: "2025-11-12T14:30:00.000Z"
 *                   createdAt: "2025-11-12T14:00:00.000Z"
 *                   orderItems: []
 *       400:
 *         description: Invalid request or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidItems:
 *                 summary: Invalid food items
 *                 value:
 *                   error: "One or more products do not exist or are not available"
 *               alreadyConfirmed:
 *                 summary: Order already confirmed
 *                 value:
 *                   error: "Order is already confirmed"
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Order not found"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Server error"
 */
router.post(
    "/:id/confirm",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: idParamSchema,
        body: ConfirmOrderSchema
    }),
    orderController.confirmOrder
)

/**
 * @openapi
 * /v1/orders/{id}:
 *   patch:
 *     security:
 *       - bearerAuth: []
 *     summary: Update order status
 *     description: |
 *       Updates the status of an existing order. This endpoint allows transitioning orders
 *       through different states in the order lifecycle.
 *       
 *       **Status transitions:**
 *       - You can transition from any state to any other state directly.
 *       - For example, you can go from PENDING to COMPLETED without passing through CONFIRMED.
 *       
 *       **Use cases:**
 *       - Mark order as completed when delivered to customer
 *       - Mark order as picked up when customer collects it
 *       - Update order workflow status in kitchen/cashier systems
 *       - Manually correct order status if needed
 *       
 *       **Important notes:**
 *       - Status changes are permanent and cannot be undone
 *       
 *       **Authentication:** Requires bearer token (admin or operator role).
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric order ID to update
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
 *               - status
 *             properties:
 *               status:
 *                 allOf:
 *                   - $ref: '#/components/schemas/OrderStatus'
 *                   - description: New status for the order
 *                     example: "COMPLETED"
 *           examples:
 *             markCompleted:
 *               summary: Mark order as completed
 *               description: Used when order has been delivered/served to customer
 *               value:
 *                 status: "COMPLETED"
 *             markPickedUp:
 *               summary: Mark order as picked up
 *               description: Used when customer has collected the order
 *               value:
 *                 status: "PICKED_UP"
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderBase'
 *             example:
 *               id: 42
 *               displayCode: "A01"
 *               table: "5"
 *               customer: "Mario Rossi"
 *               status: "COMPLETED"
 *               ticketNumber: 15
 *               total: 47.00
 *               subTotal: 50.00
 *               discount: 5.00
 *               surcharge: 2.00
 *               paymentMethod: "CASH"
 *               confirmedAt: "2025-11-12T14:30:00.000Z"
 *               createdAt: "2025-11-12T14:00:00.000Z"
 *       400:
 *         description: Invalid request or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidStatus:
 *                 summary: Invalid status value
 *                 value:
 *                   error: "Invalid status. Must be one of: PENDING, CONFIRMED, COMPLETED, PICKED_UP"
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Order not found"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: idParamSchema,
        body: PatchOrderSchema
    }),
    orderController.patchOrder
)

/**
 * @openapi
 * /v1/orders/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete an order
 *     description: |
 *       Permanently deletes an order and all its associated items from the system.
 *       
 *       **Use cases:**
 *       - Remove cancelled orders
 *       - Clean up test or erroneous orders
 *       - Maintain database hygiene
 *       
 *       **Important notes:**
 *       - This action is permanent and cannot be undone
 *       - All order items will be deleted as well
 *       - Consider the impact on reporting and analytics before deletion
 *       
 *       **Authentication:** Requires bearer token (admin or operator role).
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric order ID to delete
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 42
 *     responses:
 *       204:
 *         description: Order deleted successfully (no content returned)
 *       400:
 *         description: Invalid order ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Order ID must be a positive integer"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Order not found"
 */
router.delete(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: idParamSchema
    }),
    orderController.deleteOrder
);

export default router;