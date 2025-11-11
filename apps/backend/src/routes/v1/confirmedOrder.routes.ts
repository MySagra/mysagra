import { Router } from "express";
import { confirmedOrderSchema, createAndConfirmOrderSchema, cuidParamSchema, getConfirmedOrdersFilterSchema, patchStatusSchema } from "@/schemas";
import { validateRequest } from "@/middlewares/validateRequest";
import { authenticate } from "@/middlewares/authenticate";

import { ConfirmedOrderController } from "@/controllers/confirmedOrder.controller";
import { ConfirmedOrderService } from "@/services/confirmedOrder.service";

const router = Router();
const confirmedOrderController = new ConfirmedOrderController(new ConfirmedOrderService())

/**
 * @openapi
 * components:
 *   schemas:
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
 *           example: "clm1234567890"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Ordered quantity
 *           example: 2
 *         notes:
 *           type: string
 *           description: Special notes for the order item (optional)
 *           example: "No tomatoes"
 *     OrderInput:
 *       type: object
 *       required:
 *         - table
 *         - customer
 *         - orderItems
 *       properties:
 *         table:
 *           type: string
 *           description: Table identifier
 *           example: "A3"
 *         customer:
 *           type: string
 *           minLength: 1
 *           description: Customer name or identifier
 *           example: "Mario Rossi"
 *         orderItems:
 *           type: array
 *           description: List of order items
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OrderItemInput'
 *     ConfirmInput:
 *       type: object
 *       required:
 *         - paymentMethod
 *       properties:
 *         paymentMethod:
 *           type: string
 *           enum: [CASH, CARD]
 *           description: Payment method
 *           example: "CASH"
 *         discount:
 *           type: number
 *           format: float
 *           minimum: 0
 *           description: Applied discount (optional)
 *           example: 5.00
 *         surcharge:
 *           type: number
 *           format: float
 *           minimum: 0
 *           description: Applied surcharge (optional)
 *           example: 2.00
 *     CreateAndConfirmOrderRequest:
 *       type: object
 *       required:
 *         - order
 *         - confirm
 *       properties:
 *         order:
 *           $ref: '#/components/schemas/OrderInput'
 *         confirm:
 *           $ref: '#/components/schemas/ConfirmInput'
 *     ConfirmedOrderResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Confirmed order ID
 *           example: 123
 *         orderId:
 *           type: integer
 *           description: Original order ID
 *           example: 42
 *         ticketNumber:
 *           type: integer
 *           nullable: true
 *           description: Daily ticket number
 *           example: 15
 *         status:
 *           type: string
 *           enum: [CONFIRMED, COMPLETED, PICKED_UP]
 *           description: Confirmed order status
 *           example: "CONFIRMED"
 *         paymentMethod:
 *           type: string
 *           enum: [CASH, CARD]
 *           description: Payment method
 *           example: "CASH"
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
 *         total:
 *           type: number
 *           format: decimal
 *           description: Order total (subtotal + surcharge - discount)
 *           example: 47.00
 *         confirmedAt:
 *           type: string
 *           format: date-time
 *           description: Order confirmation date and time
 *           example: "2025-11-05T14:30:00.000Z"
 *     UpdateStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [CONFIRMED, COMPLETED, PICKED_UP]
 *           description: New order status
 *           example: "COMPLETED"
 */

/**
 * @openapi
 * /v1/confirmed-orders:
 *   get:
 *     tags:
 *       - Confirmed Orders
 *     summary: Get confirmed orders
 *     description: |
 *       Retrieves a list of confirmed orders, optionally filtered by status.
 *       
 *       **Filtering:**
 *       - No filter: returns all confirmed orders
 *       - Single status: returns orders with that specific status
 *       - Multiple statuses: returns orders matching any of the specified statuses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [CONFIRMED, COMPLETED, PICKED_UP]
 *         collectionFormat: multi
 *         required: false
 *         description: Filter orders by status (single value or array)
 *     responses:
 *       200:
 *         description: List of confirmed orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ConfirmedOrderResponse'
 *             examples:
 *               allOrders:
 *                 summary: All orders
 *                 value:
 *                   - id: 123
 *                     orderId: 42
 *                     ticketNumber: 15
 *                     status: "CONFIRMED"
 *                     paymentMethod: "CASH"
 *                     discount: 5.00
 *                     surcharge: 0
 *                     total: 45.00
 *                     confirmedAt: "2025-11-05T14:30:00.000Z"
 *                   - id: 124
 *                     orderId: 43
 *                     ticketNumber: 16
 *                     status: "COMPLETED"
 *                     paymentMethod: "CARD"
 *                     discount: 0
 *                     surcharge: 2.00
 *                     total: 32.00
 *                     confirmedAt: "2025-11-05T14:45:00.000Z"
 *               filteredOrders:
 *                 summary: Filtered by status
 *                 value:
 *                   - id: 123
 *                     orderId: 42
 *                     ticketNumber: 15
 *                     status: "CONFIRMED"
 *                     paymentMethod: "CASH"
 *                     discount: 5.00
 *                     surcharge: 0
 *                     total: 45.00
 *                     confirmedAt: "2025-11-05T14:30:00.000Z"
 *       400:
 *         description: Invalid filter parameter
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
 *             example:
 *               message: "Validation error"
 *               errors:
 *                 - field: "filter"
 *                   message: "Invalid status value"
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
 */
router.get(
    '/',
    authenticate(['operator', 'admin']),
    validateRequest({
        query: getConfirmedOrdersFilterSchema
    }),
    confirmedOrderController.getConfirmedOrders
)


/**
 * @openapi
 * /v1/confirmed-orders:
 *   post:
 *     tags:
 *       - Confirmed Orders
 *     summary: Create and confirm an order
 *     description: |
 *       Creates a new order and immediately confirms it with payment information.
 *       This operation performs both order creation and confirmation in a single atomic transaction.
 *       
 *       **Operational flow:**
 *       1. Creates a new order with customer, table and items information
 *       2. Assigns a daily progressive ticket number
 *       3. Calculates the total (subtotal + surcharge - discount)
 *       4. Creates the confirmed order with payment details
 *       5. Broadcasts events to cashier and display clients
 *       
 *       **Total calculation:**
 *       - Subtotal = Σ(quantity × price)
 *       - Total = Subtotal + surcharge - discount
 *       
 *       **Request structure:**
 *       - `order`: Contains order details (table, customer, items)
 *       - `confirm`: Contains payment and adjustment details (payment method, discount, surcharge)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAndConfirmOrderRequest'
 *           examples:
 *             orderWithDiscount:
 *               summary: Order with discount
 *               value:
 *                 order:
 *                   table: "A3"
 *                   customer: "Mario Rossi"
 *                   orderItems:
 *                     - foodId: "clm1234567890"
 *                       quantity: 2
 *                     - foodId: "clm9876543210"
 *                       quantity: 1
 *                       notes: "No onions"
 *                 confirm:
 *                   paymentMethod: "CASH"
 *                   discount: 5.00
 *                   surcharge: 2.00
 *             orderWithSurcharge:
 *               summary: Order with surcharge
 *               value:
 *                 order:
 *                   table: "B1"
 *                   customer: "Luigi Verdi"
 *                   orderItems:
 *                     - foodId: "clm1234567890"
 *                       quantity: 3
 *                 confirm:
 *                   paymentMethod: "CARD"
 *                   surcharge: 2.00
 *             completeOrder:
 *               summary: Complete order with all fields
 *               value:
 *                 order:
 *                   table: "C5"
 *                   customer: "Anna Bianchi"
 *                   orderItems:
 *                     - foodId: "clm1234567890"
 *                       quantity: 2
 *                       notes: "Extra cheese"
 *                     - foodId: "clm9876543210"
 *                       quantity: 1
 *                     - foodId: "clm5555555555"
 *                       quantity: 3
 *                       notes: "No salt"
 *                 confirm:
 *                   paymentMethod: "CASH"
 *                   discount: 3.50
 *                   surcharge: 1.50
 *     responses:
 *       201:
 *         description: Order created and confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfirmedOrderResponse'
 *             example:
 *               id: 123
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
 *               missingOrder:
 *                 summary: Missing order object
 *                 value:
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "order"
 *                       message: "Order information is required"
 *               missingCustomer:
 *                 summary: Missing customer name
 *                 value:
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "order.customer"
 *                       message: "Customer name is required"
 *               emptyOrderItems:
 *                 summary: No items in order
 *                 value:
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "order.orderItems"
 *                       message: "Order must contain at least one item"
 *               missingPaymentMethod:
 *                 summary: Missing payment method
 *                 value:
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "confirm.paymentMethod"
 *                       message: "Payment method is required"
 *               invalidFoodId:
 *                 summary: Invalid food ID format
 *                 value:
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "order.orderItems[0].foodId"
 *                       message: "Food ID must be a valid CUID"
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
 *         description: Food item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Food item not found"
 *             example:
 *               error: "Food item not found"
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
    '/',
    authenticate(['operator', 'admin']),
    validateRequest({
        body: createAndConfirmOrderSchema
    }),
    confirmedOrderController.createAndConfirmOrder
)

/**
 * @openapi
 * /v1/confirmed-orders/status/{id}:
 *   patch:
 *     tags:
 *       - Confirmed Orders
 *     summary: Update order status
 *     description: |
 *       Updates the status of a confirmed order.
 *       
 *       **Status flow:**
 *       - CONFIRMED: Order has been confirmed and is being prepared
 *       - COMPLETED: Order preparation is complete and ready for pickup
 *       - PICKED_UP: Order has been picked up by the customer
 *       
 *       **Use cases:**
 *       - Kitchen completes order: CONFIRMED → COMPLETED
 *       - Customer picks up order: COMPLETED → PICKED_UP
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: Confirmed order ID
 *         example: "clm1234567890"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *           examples:
 *             markAsCompleted:
 *               summary: Mark order as completed
 *               value:
 *                 status: "COMPLETED"
 *             markAsPickedUp:
 *               summary: Mark order as picked up
 *               value:
 *                 status: "PICKED_UP"
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfirmedOrderResponse'
 *             example:
 *               id: 123
 *               orderId: 42
 *               ticketNumber: 15
 *               status: "COMPLETED"
 *               paymentMethod: "CASH"
 *               discount: 5.00
 *               surcharge: 0
 *               total: 45.00
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
 *               missingStatus:
 *                 summary: Missing status field
 *                 value:
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "status"
 *                       message: "Status is required"
 *               invalidStatus:
 *                 summary: Invalid status value
 *                 value:
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "status"
 *                       message: "Status must be one of: CONFIRMED, COMPLETED, PICKED_UP"
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
 */
router.patch(
    '/status/:id',
    authenticate(['operator', 'admin']),
    validateRequest({
        params: cuidParamSchema,
        body: patchStatusSchema
    }),
    confirmedOrderController.patchStatus
)

export default router;