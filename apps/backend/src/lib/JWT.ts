import { Token } from "@/types/token";
import { Role, User } from "@generated/prisma_client/client";

import jwt from "jsonwebtoken"

const SECRET = process.env.JWT_SECRET

export function generateJwt(user: User & { role: Role }): string {
    if (!SECRET) {
        throw new Error("JWT secret not set")
    }

    return jwt.sign(
        { userId: user.id, role: user.role },
        SECRET,
        { expiresIn: "2h" }
    )
}

export function getJWTPayload(token: string) : Token | null {
    if (!SECRET) {
        throw new Error("JWT secret not set")
    }
    try {
        const payload = jwt.verify(token, SECRET);
        if (typeof payload === "string") {
            return null;
        }
        return payload as Token;
    } catch (err) {
        return null;
    }
}
