import { Router } from "express";

import { EventController } from "@/controllers/event.controller";
import { validateRequest } from "@/middlewares/validateRequest";
import { eventSchema } from "@/schemas/event";
import { authenticate } from "@/middlewares/authenticate";

const eventController = new EventController();

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SSEMessage:
 *       type: object
 *       description: Server-Sent Event message format
 *       properties:
 *         data:
 *           type: string
 *           description: JSON stringified event data
 *           example: '{"id":123,"displayCode":"A01","table":"5","customer":"Mario Rossi"}'
 */

/**
 * @openapi
 * /events/{channel}:
 *   get:
 *     tags:
 *       - Events (SSE)
 *     summary: Subscribe to Server-Sent Events (SSE) for real-time updates
 *     description: |
 *       Establishes a persistent Server-Sent Events (SSE) connection to receive real-time updates for a specific channel.
 *       
 *       **How SSE works:**
 *       - Client opens a long-lived HTTP connection
 *       - Server pushes updates to the client as they occur
 *       - Connection stays open with periodic keep-alive messages every 15 seconds
 *       - Client automatically reconnects if connection is lost
 *       
 *       **Available Channels:**
 *       
 *       ---
 *       
 *       ### `cashier`
 *       Broadcasts real-time updates for the cashier interface when orders are created or confirmed.
 *       
 *       **Event: `new-order`** — Fired when a new order is placed.
 *       ```json
 *       {
 *         "id": 1,
 *         "displayCode": "A01",
 *         "table": "3",
 *         "customer": "John Doe",
 *         "createdAt": "2026-01-15T18:30:00.000Z",
 *         "confirmedAt": null,
 *         "ticketNumber": null,
 *         "status": "PENDING",
 *         "paymentMethod": null,
 *         "subTotal": "25",
 *         "discount": "0",
 *         "surcharge": "0",
 *         "total": "25",
 *         "userId": null,
 *         "cashRegisterId": null,
 *         "orderItems": [
 *           {
 *             "id": "clx0abc0001mx01example",
 *             "quantity": 2,
 *             "orderId": 1,
 *             "foodId": "clx0def0002mx01example",
 *             "unitPrice": "12.5",
 *             "unitSurcharge": "0",
 *             "total": "25",
 *             "notes": "No onions"
 *           }
 *         ]
 *       }
 *       ```
 *       
 *       **Event: `confirmed-order`** — Fired when an order is confirmed by a cashier.
 *       ```json
 *       {
 *         "displayCode": "A01",
 *         "ticketNumber": 1,
 *         "id": 1
 *       }
 *       ```
 *       
 *       ---
 *       
 *       ### `display`
 *       Broadcasts real-time updates for display systems (kitchen screens, customer-facing displays) when order confirmations occur.
 *       
 *       **Event: `confirmed-order`** — Fired when an order is confirmed.
 *       ```json
 *       {
 *         "displayCode": "A01",
 *         "ticketNumber": 1,
 *         "id": 1
 *       }
 *       ```
 *       
 *       ---
 *       
 *       ### `printer`
 *       Broadcasts real-time updates for printers when a cashier confirms a new order. Includes full order details for printing.
 *       
 *       **Event: `confirmed-order`** — Fired when an order is confirmed, includes full order details for printing.
 *       ```json
 *       {
 *         "id": 1,
 *         "displayCode": "A01",
 *         "table": "3",
 *         "customer": "John Doe",
 *         "createdAt": "2026-01-15T18:30:00.000Z",
 *         "confirmedAt": "2026-01-15T18:35:12.000Z",
 *         "ticketNumber": 1,
 *         "status": "CONFIRMED",
 *         "paymentMethod": "CASH",
 *         "subTotal": "25",
 *         "discount": "2",
 *         "surcharge": "1",
 *         "total": "24",
 *         "userId": "clx0usr0003mx01example",
 *         "cashRegisterId": "clx0csh0004mx01example",
 *         "orderItems": [
 *           {
 *             "id": "clx0abc0001mx01example",
 *             "quantity": 2,
 *             "orderId": 1,
 *             "notes": "Extra spicy",
 *             "unitPrice": "12.5",
 *             "unitSurcharge": "0.5",
 *             "total": "26",
 *             "food": {
 *               "id": "clx0def0002mx01example",
 *               "name": "Margherita",
 *               "printerId": null
 *             }
 *           }
 *         ]
 *       }
 *       ```
 *       
 *       ---
 *       
 *       **Connection details:**
 *       - Content-Type: `text/event-stream`
 *       - Cache-Control: `no-cache`
 *       - Connection: `keep-alive`
 *       - Keep-alive messages sent every 15 seconds (`: keep-alive\n\n`)
 *       - Data messages format: `data: {JSON}\n\n`
 *       
 *       **Example client implementation (JavaScript):**
 *       ```javascript
 *       const eventSource = new EventSource('/events/cashier', {
 *         headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
 *       });
 *       
 *       eventSource.onmessage = (event) => {
 *         const orderData = JSON.parse(event.data);
 *         console.log('Order update:', orderData);
 *       };
 *       
 *       eventSource.onerror = (error) => {
 *         console.error('SSE connection error:', error);
 *       };
 *       ```
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channel
 *         required: true
 *         description: |
 *           Event channel to subscribe to.
 *           Available channels: `cashier`, `display`, `printer`
 *         schema:
 *           type: string
 *           enum: [cashier, display, printer]
 *           example: "cashier"
 *     responses:
 *       200:
 *         description: SSE connection established successfully. Stream remains open for real-time updates.
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: |
 *                 Server-Sent Events stream. Messages are sent in the format:
 *                 - Keep-alive: `: keep-alive\n\n`
 *                 - Data event: `data: {JSON}\n\n`
 *             examples:
 *               keepAlive:
 *                 summary: Keep-alive heartbeat message
 *                 value: ": keep-alive\n\n"
 *               newOrder:
 *                 summary: New order event (cashier channel)
 *                 value: |
 *                   data: {"id":1,"displayCode":"A01","table":"3","customer":"John Doe","createdAt":"2026-01-15T18:30:00.000Z","confirmedAt":null,"ticketNumber":null,"status":"PENDING","paymentMethod":null,"subTotal":"25","discount":"0","surcharge":"0","total":"25","userId":null,"cashRegisterId":null,"orderItems":[{"id":"clx0abc0001mx01example","quantity":2,"orderId":1,"foodId":"clx0def0002mx01example","unitPrice":"12.5","unitSurcharge":"0","total":"25","notes":"No onions"}]}
 *               confirmedOrderCashier:
 *                 summary: Confirmed order event (cashier/display channel)
 *                 value: |
 *                   data: {"displayCode":"A01","ticketNumber":1,"id":1}
 *               confirmedOrderPrinter:
 *                 summary: Confirmed order event (printer channel)
 *                 value: |
 *                   data: {"id":1,"displayCode":"A01","table":"3","customer":"John Doe","createdAt":"2026-01-15T18:30:00.000Z","confirmedAt":"2026-01-15T18:35:12.000Z","ticketNumber":1,"status":"CONFIRMED","paymentMethod":"CASH","subTotal":"25","discount":"2","surcharge":"1","total":"24","userId":"clx0usr0003mx01example","cashRegisterId":"clx0csh0004mx01example","orderItems":[{"id":"clx0abc0001mx01example","quantity":2,"notes":"Extra spicy","unitPrice":"12.5","unitSurcharge":"0.5","total":"26","food":{"id":"clx0def0002mx01example","name":"Margherita","printerId":null}}]}
 *       400:
 *         description: Invalid channel parameter
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
 *                 - field: "channel"
 *                   message: "Invalid enum value. Expected 'cashier' | 'display' | 'printer'"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - Insufficient permissions (operators and administrators only)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden - Insufficient permissions"
 */
router.get(
    '/:channel',
    authenticate(["admin", "operator"]),
    validateRequest({
        params: eventSchema
    }),
    eventController.handleSseConnection
)

export default router;