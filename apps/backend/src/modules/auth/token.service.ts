import { env } from "@/config/env"
import jwt from "jsonwebtoken"
import { prisma } from "@mysagra/database";
import { User, Role } from "@mysagra/database";
import { TokenPayloadSchema } from "@mysagra/schemas";
import { redisClient } from "@/lib/redis";

export class TokenService {
    private secret = env.JWT_SECRET;

    async generateToken(user: User & { role: Role }) {
        return jwt.sign(
            {
                sub: user.id,
                username: user.username,
                role: user.role.name
            },
            this.secret,
            { expiresIn: "6h" }
        );
    }

    async revokeToken(token: string): Promise<boolean> {
        const payload = this.getTokenPayload(token);

        if (payload) {
            const nowInSeconds = Math.floor(Date.now() / 1000);
            const timeRemaining = payload.exp - nowInSeconds;

            if (timeRemaining > 0) {
                await redisClient.setEx(`blacklist:${token}`, timeRemaining, "REVOKED");
            }
            return true;
        }
        return false;
    }

    getTokenPayload(token: string) {
        try {
            const payload = jwt.verify(token, this.secret);
            const parsed = TokenPayloadSchema.safeParse(payload);
            if (!parsed.success) return null;
            return parsed.data;
        } catch (err) {
            return null;
        }
    }
}