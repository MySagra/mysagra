import { Role } from "@generated/prisma_client/client";

export type Token = {
    userId: number,
    role: Role,
    iat: number,
    exp: number
}