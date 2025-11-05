import { Router } from "express";
import { confirmedOrderSchema } from "@/schemas";
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
 *     ConfirmOrderRequest:
 *       type: object
 *       required:
 *         - orderId
 *         - paymentMethod
 *         - orderItems
 *       properties:
 *         orderId:
 *           type: integer
 *           minimum: 0
 *           description: Order ID to confirm
 *           example: 42
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
 *         orderItems:
 *           type: array
 *           description: List of order items
 *           items:
 *             $ref: '#/components/schemas/OrderItemInput'
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
 */

/**
 * @openapi
 * /v1/confirm-order:
 *   post:
 *     tags:
 *       - Confirmed Orders
 *     summary: Confirm an order
 *     description: |
 *       Confirms an existing order, assigns a daily progressive ticket number,
 *       recalculates the total and saves payment information.
 *       
 *       **Operational flow:**
 *       1. Deletes previous order items
 *       2. Recreates items with updated data
 *       3. Generates a daily progressive ticket number
 *       4. Calculates the total (subtotal + surcharge - discount)
 *       5. Saves the confirmed order
 *       
 *       **Total calculation:**
 *       - Subtotal = Σ(quantity × price)
 *       - Total = Subtotal + surcharge - discount
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmOrderRequest'
 *           examples:
 *             orderWithDiscount:
 *               summary: Order with discount
 *               value:
 *                 orderId: 42
 *                 paymentMethod: "CASH"
 *                 discount: 5.00
 *                 orderItems:
 *                   - foodId: "clm1234567890"
 *                     quantity: 2
 *                   - foodId: "clm9876543210"
 *                     quantity: 1
 *                     notes: "No onions"
 *             orderWithSurcharge:
 *               summary: Order with surcharge
 *               value:
 *                 orderId: 43
 *                 paymentMethod: "CARD"
 *                 surcharge: 2.00
 *                 orderItems:
 *                   - foodId: "clm1234567890"
 *                     quantity: 3
 *     responses:
 *       201:
 *         description: Order confirmed successfully
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
 *               invalidOrderId:
 *                 summary: Invalid order ID
 *                 value:
 *                   message: "Validation error"
 *                   errors:
 *                     - field: "orderId"
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
 *                 message:
 *                   type: string
 *                   example: "Order not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post(
    '/',
    authenticate(['operator', 'admin']),
    validateRequest({
        body: confirmedOrderSchema
    }),
    confirmedOrderController.createConfirmOrder
)

export default router;