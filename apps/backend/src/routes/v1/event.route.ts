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
 * /v1/events/{channel}:
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
 *       **`order`** - Order events channel
 *       - Broadcasts real-time updates when orders are created, updated, or deleted
 *       - Event data includes complete order information with items
 *       - Use case: Display live order feed in kitchen display systems or operator dashboards
 *       - Message format: Complete order object matching the POST /v1/orders response
 *       
 *       **Connection details:**
 *       - Content-Type: `text/event-stream`
 *       - Keep-alive messages sent every 15 seconds (`: keep-alive\n\n`)
 *       - Data messages format: `data: {JSON}\n\n`
 *       
 *       **Example client implementation (JavaScript):**
 *       ```javascript
 *       const eventSource = new EventSource('/v1/events/order', {
 *         headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
 *       });
 *       
 *       eventSource.onmessage = (event) => {
 *         const orderData = JSON.parse(event.data);
 *         console.log('New order:', orderData);
 *       };
 *       
 *       eventSource.onerror = (error) => {
 *         console.error('SSE error:', error);
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
 *           Currently available: `order`
 *         schema:
 *           type: string
 *           enum: [order]
 *           example: "order"
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
 *               orderCreated:
 *                 summary: New order created event (order channel)
 *                 value: |
 *                   data: {"id":123,"displayCode":"A01","table":"5","customer":"Mario Rossi","subTotal":"25.50","createdAt":"2025-11-08T10:30:00Z","orderItems":[{"id":"clx123","quantity":2,"foodId":"clx456","notes":null}]}
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
 *                   message: "Invalid enum value. Expected 'order'"
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