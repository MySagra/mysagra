import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";

import { validateRequest } from "@/middlewares/validateRequest";
import { cuidParamSchema } from "@/schemas";

import { RoleController } from "@/controllers/role.controller";
import { RoleService } from "@/services/role.service";

const roleController = new RoleController(new RoleService());

const router = Router();

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
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "cjld2cyuq0000t3rmniod1foy"
 *                   name:
 *                     type: string
 *                     example: "admin"
 *       404:
 *         description: Roles not found
 */
router.get(
    "/",
    authenticate(["admin", "operator"]),
    roleController.getRoles
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
 *         description: ID of the role
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "cjld2cyuq0000t3rmniod1foy"
 *                 name:
 *                   type: string
 *                   example: "admin"
 *       404:
 *         description: Role not found
 */
router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: cuidParamSchema
    }),
    roleController.getRoleById
);

/*
router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: CreateRoleSchema
    }),
    roleController.createRole
);
router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: idParamSchema,
        body: CreateRoleSchema
    }),
    roleController.updateRole
);

router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: idParamSchema
    }),
    roleController.deleteRole
);
*/
export default router;