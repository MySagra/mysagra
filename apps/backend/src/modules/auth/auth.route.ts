import { Router } from "express";
import { Request, Response } from "express";

import { LoginSchema } from "@/schemas/auth";
import { validateRequest } from "@/middlewares/validateRequest";

import { AuthService } from "@/services/auth.service";
import { AuthController } from "@/controllers/auth.controller";


const authController = new AuthController(new AuthService());

const router = Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: refreshToken
 *       description: HTTP-only refresh token cookie
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
 *             id:
 *               type: string
 *               description: User's unique identifier
 *               example: "clxyz123456789abcdef"
 *             username:
 *               type: string
 *               description: User's username
 *               example: "admin"
 *             role:
 *               type: string
 *               description: User's role name
 *               example: "admin"
 *         accessToken:
 *           type: string
 *           description: JWT access token for authentication (short-lived, expires in 15 minutes)
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
 *     RefreshResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: New JWT access token (expires in 15 minutes)
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
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
 *     description: |
 *       Authenticate a user with username and password. Returns user information and access token in response body.
 *       The refresh token is automatically set as an HTTP-only cookie named 'refreshToken' with 7 days expiration.
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
 *         description: |
 *           User authenticated successfully. Access token returned in response body.
 *           Refresh token set as HTTP-only cookie 'refreshToken' (expires in 7 days).
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only refresh token cookie
 *             schema:
 *               type: string
 *               example: "refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/"
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
    validateRequest({
        body: LoginSchema
    }),
    authController.login
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: |
 *       Revoke a refresh token to logout a user from a specific device/session.
 *       The refresh token is automatically read from the 'refreshToken' HTTP-only cookie.
 *       
 *       **Testing in Swagger UI:**
 *       1. First call `/auth/login` to set the refresh token cookie
 *       2. Then call this endpoint - the cookie will be sent automatically
 *       3. Alternatively, manually set the cookie in your browser dev tools
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully (refresh token revoked)
 *       400:
 *         description: Bad request - Missing or invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Bad request"
 *       401:
 *         description: Unauthorized - Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Invalid token"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    "/logout",
    authController.logout
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Generate a new access token using the refresh token.
 *       The refresh token is automatically read from the 'refreshToken' HTTP-only cookie.
 *       
 *       **Testing in Swagger UI:**
 *       1. First call `/auth/login` to set the refresh token cookie
 *       2. When your access token expires, call this endpoint to get a new one
 *       3. The refresh token cookie will be sent automatically
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *       400:
 *         description: Bad request - Refresh token missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Refresh token missing"
 *       401:
 *         description: Unauthorized - Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Refresh token not valid"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    "/refresh",
    authController.refresh
)

export default router;