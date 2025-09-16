import { Router } from "express";
import { checkUniqueRoleName, checkRoleExists } from "@/middlewares/checkRole";
import { authenticate } from "@/middlewares/authenticate";

import { validateParams, validateBody } from "@/middlewares/validateRequest";
import { roleSchema, idParamSchema } from "@/validators";

import { RoleController } from "@/controllers/role.controller";
import { RoleService } from "@/services/role.service";

const roleController = new RoleController(new RoleService());

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RoleResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         name:
 *           type: string
 *           example: "admin"
 *     RoleRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "admin"
 */

/**
 * @openapi
 * /v1/roles:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all roles
 *     tags:
 *       - Roles
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoleResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/",
    authenticate(["admin", "operator"]),
    roleController.getRoles
);

/**
 * @openapi
 * /v1/roles:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new role
 *     tags:
 *       - Roles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleRequest'
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleResponse'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Role name already exists
 */
router.post(
    "/",
    authenticate(["admin"]),
    validateBody(roleSchema),
    checkUniqueRoleName,
    roleController.createRole
);

/**
 * @openapi
 * /v1/roles/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Update a role
 *     tags:
 *       - Roles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the role to update
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleRequest'
 *     responses:
 *       201:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleResponse'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 *       409:
 *         description: Role name already exists
 */
router.put(
    "/:id",
    authenticate(["admin"]),
    validateParams(idParamSchema),
    validateBody(roleSchema),
    checkRoleExists,
    checkUniqueRoleName,
    roleController.updateRole
);

/**
 * @openapi
 * /v1/roles/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a role
 *     tags:
 *       - Roles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the role to delete
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       204:
 *         description: Role deleted successfully
 *       400:
 *         description: Invalid role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.delete(
    "/:id",
    authenticate(["admin"]),
    validateParams(idParamSchema),
    roleController.deleteRole
);

/**
 * @openapi
 * /v1/roles/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get a role by ID
 *     tags:
 *       - Roles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the role to retrieve
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleResponse'
 *       400:
 *         description: Invalid role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateParams(idParamSchema),
    roleController.getRoleById
);

export default router;