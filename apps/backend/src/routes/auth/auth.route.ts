import { Router } from "express";
import { Request, Response } from "express";

import { loginSchema } from "@/validators/auth";
import { validateBody } from "@/middlewares/validateRequest";

import { AuthService } from "@/services/auth.service";
import { AuthController } from "@/controllers/auth.controller";


const authController = new AuthController(new AuthService());

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: User's username
 *           example: "admin"
 *         password:
 *           type: string
 *           description: User's password
 *           example: "password123"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *               description: User's username
 *               example: "admin"
 *             role:
 *               type: string
 *               description: User's role name
 *               example: "admin"
 *         token:
 *           type: string
 *           description: JWT token for authentication
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: Authenticate a user with username and password, returning user information and JWT token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Bad request - Missing username or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Bad request"
 *       401:
 *         description: Unauthorized - Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Unauthorized"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "User not exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    "/login",
    validateBody(loginSchema),
    authController.login
);

export default router;