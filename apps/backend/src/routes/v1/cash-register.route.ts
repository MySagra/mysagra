import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";

import { validateRequest } from "@/middlewares/validateRequest";
import { cuidParamSchema, cashRegisterSchema, getCashRegisterQuerySchema, patchCashRegisterSchema } from "@/schemas";

import { CashRegisterController } from "@/controllers/cash-register.controller";
import { CashRegisterService } from "@/services/cash-register.service";

const cashRegisterController = new CashRegisterController(new CashRegisterService());

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CashRegister:
 *       type: object
 *       required:
 *         - name
 *         - defaultPrinterId
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the cash register
 *           example: "clx1a2b3c4d5e6f7g8h9i0j1"
 *         name:
 *           type: string
 *           description: The name of the cash register
 *           example: "Bar Cash Register"
 *         enabled:
 *           type: boolean
 *           description: Whether the cash register is enabled
 *           default: true
 *           example: true
 *         defaultPrinterId:
 *           type: string
 *           description: The id of the default printer
 *           example: "clx1a2b3c4d5e6f7g8h9i0j1"
 *     CashRegisterInput:
 *       type: object
 *       required:
 *         - name
 *         - defaultPrinterId
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the cash register
 *           example: "Bar Cash Register"
 *         enabled:
 *           type: boolean
 *           description: Whether the cash register is enabled
 *           default: true
 *           example: true
 *         defaultPrinterId:
 *           type: string
 *           description: The id of the default printer
 *           example: "clx1a2b3c4d5e6f7g8h9i0j1"
 *     CashRegisterPatchInput:
 *       type: object
 *       required:
 *         - enabled
 *       properties:
 *         enabled:
 *           type: boolean
 *           description: Whether the cash register is enabled
 *           example: false
 */

/**
 * @openapi
 * /v1/cash-registers:
 *   get:
 *     summary: Get all cash registers
 *     tags: [CashRegisters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [printer]
 *         description: Include related resources (e.g. printer)
 *     responses:
 *       200:
 *         description: The list of the cash registers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CashRegister'
 */
router.get(
    "/",
    authenticate(["admin", "operator"]),
    validateRequest({
        query: getCashRegisterQuerySchema
    }),
    cashRegisterController.getCashRegisters
);

/**
 * @openapi
 * /v1/cash-registers/{id}:
 *   get:
 *     summary: Get the cash register by id
 *     tags: [CashRegisters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The cash register id
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [printer]
 *         description: Include related resources (e.g. printer)
 *     responses:
 *       200:
 *         description: The cash register description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashRegister'
 *       404:
 *         description: The cash register was not found
 */
router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: cuidParamSchema,
        query: getCashRegisterQuerySchema
    }),
    cashRegisterController.getCashRegisterById
);

/**
 * @openapi
 * /v1/cash-registers:
 *   post:
 *     summary: Create a new cash register
 *     tags: [CashRegisters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CashRegisterInput'
 *     responses:
 *       201:
 *         description: The cash register was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashRegister'
 *       400:
 *         description: Invalid input
 */
router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: cashRegisterSchema
    }),
    cashRegisterController.createCashRegister
);

/**
 * @openapi
 * /v1/cash-registers/{id}:
 *   put:
 *     summary: Update the cash register by the id
 *     tags: [CashRegisters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The cash register id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CashRegisterInput'
 *     responses:
 *       200:
 *         description: The cash register was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashRegister'
 *       404:
 *         description: The cash register was not found
 */
router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: cashRegisterSchema
    }),
    cashRegisterController.updateCashRegister
);

/**
 * @openapi
 * /v1/cash-registers/{id}:
 *   patch:
 *     summary: Update the cash register status by the id
 *     tags: [CashRegisters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The cash register id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CashRegisterPatchInput'
 *     responses:
 *       200:
 *         description: The cash register status was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashRegister'
 *       404:
 *         description: The cash register was not found
 */
router.patch(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: patchCashRegisterSchema
    }),
    cashRegisterController.patchCashRegister
);

/**
 * @openapi
 * /v1/cash-registers/{id}:
 *   delete:
 *     summary: Remove the cash register by id
 *     tags: [CashRegisters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The cash register id
 *     responses:
 *       200:
 *         description: The cash register was deleted
 *       404:
 *         description: The cash register was not found
 */
router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    cashRegisterController.deleteCashRegister
);

export default router;