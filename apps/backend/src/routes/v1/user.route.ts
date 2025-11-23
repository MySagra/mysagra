import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";

import { validateRequest } from "@/middlewares/validateRequest";
import { userSchema, idParamSchema } from "@/schemas";

import { UserService } from "@/services/user.service";
import { UserController } from "@/controllers/user.controller";

const userController = new UserController(new UserService());

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clxyz123456789abcdef"
 *         username:
 *           type: string
 *           example: "john_doe"
 *         role:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "clxyz123456789abcdef"
 *             name:
 *               type: string
 *               example: "admin"
 *     UserRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           minLength: 6
 *           example: "john_doe"
 *         password:
 *           type: string
 *           minLength: 8
 *           example: "password123"
 *         roleId:
 *           type: string
 *           example: "clxyz123456789abcdef"
 */

/**
 * @openapi
 * /v1/users:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/",
    authenticate(["admin"]),
    userController.getUsers
);

/**
 * @openapi
 * /v1/users:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Username already exists
 */
router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: userSchema
    }),
    userController.createUser
);

/**
 * @openapi
 * /v1/users/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Update a user
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: idParamSchema,
        body: userSchema
    }),
    userController.updateUser
)

/**
 * @openapi
 * /v1/users/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a user
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to delete
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: idParamSchema
    }),
    userController.deleteUser
);

/**
 * @openapi
 * /v1/users/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get a user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: idParamSchema
    }),
    userController.getUserById
);

export default router;