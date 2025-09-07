import { Router } from "express";
import { Request, Response } from "express";
import prisma from "@/utils/prisma";
import { checkHashPassword } from "@/lib/hashPassword";
import { generateJwt } from "@/lib/JWT";

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
router.post("/", async (req: Request, res: Response) => {
    const { username, password } = req.body

    if (!(username && password)) {
        res.status(400).json({
            message: "Bad request"
        });
        return;
    }

    const user = await prisma.user.findUnique({
        where: {
            username
        },
        include: {
            role: true
        }
    });

    if (!user) {
        res.status(404).json({
            message: "User not exists"
        });
        return;
    }

    if (await checkHashPassword(password, user.password)) {
        res.status(200).json({
            user: {
                username: user.username,
                role: user.role.name
            },
            token: generateJwt(user)
        });
    }
    else {
        res.status(401).json({
            message: "Unauthorized"
        });
    }
});

export default router;