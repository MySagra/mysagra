import { env } from "@/config/env"
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken"
import { prisma } from "@mysagra/database";
import { User, Role } from "@mysagra/database";
import { TokenPayloadSchema } from "@mysagra/schemas";

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

    /*
    async revokeToken(token: string): Promise<Boolean> {
        if (!await this.isRefreshTokenValid(token)) return false;
        return await prisma.refreshToken.update({
            where: {
                token
            },
            data: {
                revokedAt: new Date(Date.now())
            }
        }) != null;
    }
    */

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