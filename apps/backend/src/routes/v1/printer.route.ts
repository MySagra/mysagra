import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";

import { validateRequest } from "@/middlewares/validateRequest";
import { cuidParamSchema, printerSchema } from "@/schemas";

import { PrinterController } from "@/controllers/printer.controller";
import { PrinterService } from "@/services/printer.service";

const printerController = new PrinterController(new PrinterService());

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Printer:
 *       type: object
 *       required:
 *         - name
 *         - ip
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the printer
 *           example: "clx1a2b3c4d5e6f7g8h9i0j1"
 *         name:
 *           type: string
 *           description: The name of the printer
 *           example: "Kitchen Printer"
 *         ip:
 *           type: string
 *           description: The IP address of the printer
 *           example: "192.168.1.200"
 *         port:
 *           type: integer
 *           description: The port of the printer
 *           default: 9100
 *           example: 9100
 *         description:
 *           type: string
 *           description: The description of the printer
 *           example: "Printer located in the kitchen"
 *     PrinterInput:
 *       type: object
 *       required:
 *         - name
 *         - ip
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the printer
 *           example: "Kitchen Printer"
 *         ip:
 *           type: string
 *           description: The IP address of the printer
 *           example: "192.168.1.200"
 *         port:
 *           type: integer
 *           description: The port of the printer
 *           example: 9100
 *         description:
 *           type: string
 *           description: The description of the printer
 *           example: "Printer located in the kitchen"
 */

/**
 * @openapi
 * /v1/printers:
 *   get:
 *     summary: Get all printers
 *     tags: [Printers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of the printers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Printer'
 */
router.get(
    "/",
    authenticate(["admin", "operator"]),
    printerController.getPrinters
);

/**
 * @openapi
 * /v1/printers/{id}:
 *   get:
 *     summary: Get the printer by id
 *     tags: [Printers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The printer id
 *     responses:
 *       200:
 *         description: The printer description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Printer'
 *       404:
 *         description: The printer was not found
 */
router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: cuidParamSchema,
    }),
    printerController.getPrinterById
);

/**
 * @openapi
 * /v1/printers:
 *   post:
 *     summary: Create a new printer
 *     tags: [Printers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrinterInput'
 *     responses:
 *       201:
 *         description: The printer was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Printer'
 *       400:
 *         description: Invalid input
 */
router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: printerSchema
    }),
    printerController.createPrinter
);

/**
 * @openapi
 * /v1/printers/{id}:
 *   put:
 *     summary: Update the printer by the id
 *     tags: [Printers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The printer id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrinterInput'
 *     responses:
 *       200:
 *         description: The printer was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Printer'
 *       404:
 *         description: The printer was not found
 */
router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: printerSchema
    }),
    printerController.updatePrinter
);

/**
 * @openapi
 * /v1/printers/{id}:
 *   delete:
 *     summary: Remove the printer by id
 *     tags: [Printers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The printer id
 *     responses:
 *       200:
 *         description: The printer was deleted
 *       404:
 *         description: The printer was not found
 */
router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    printerController.deletePrinter
);

export default router;