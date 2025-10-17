import { env } from "@/config/env"
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken"
import prisma from "@/utils/prisma";
import { User, Role } from "@generated/prisma_client";

export class TokenService {
    private secret = env.JWT_SECRET;

    async generateRefreshToken(userId: number, ip?: string, userAgent?: string) {
        const token = jwt.sign(
            { sub: userId, jti: randomUUID()},
            this.secret,
            { expiresIn: "7d" }
        )

        await prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
                ip,
                userAgent
            }
        })

        return token;
    }

    async generateAccessToken(user: User & { role: Role }) {
        return jwt.sign(
            { 
                sub: user.id,
                username: user.username,
                role: user.role,
                iat: Date.now()
            },
            this.secret,
            { expiresIn: "15m" }
        );
    }

    async isRefreshTokenValid(token: string): Promise<boolean> {
        try {
            const payload = jwt.verify(token, this.secret);
            if (typeof payload === "string") return false;
            const storedToken = await prisma.refreshToken.findUnique({
                where: {
                    token
                }
            });
            if (!storedToken || storedToken.revokedAt) return false;
            return true;
        } catch (err) {
            return false;
        }
    }

    async revokeToken(token: string) : Promise<Boolean> {
        if(!await this.isRefreshTokenValid(token)) return false;
        return await prisma.refreshToken.update({
            where: {
                token
            },
            data: {
                revokedAt: new Date(Date.now())
            }
        }) != null;
    }

    getPayload(token: string) {
        try {
            const payload = jwt.verify(token, this.secret);
            if (typeof payload === "string") return null;
            return payload;
        } catch (err) {
            return null;
        }
    }
}