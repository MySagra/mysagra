import { checkHashPassword } from "@/lib/hashPassword";
import { prisma } from "@mysagra/database";
import { UnauthorizedError, NotFoundError } from "@/common/errors";

import { sessionsService } from "./sessions.service";
import { RoleEnum, SessionPayload } from "@mysagra/schemas";
export class AuthService {
    async login(username: string, password: string, userAgent?: string) {
        const user = await prisma.user.findUnique(
            {
                where: { username },
                include: { role: true }
            }
        );
        if (!user) {
            throw new UnauthorizedError("Invalid credentials");
        }

        const isPasswordValid = await checkHashPassword(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError("Invalid credentials");
        }
        const sessionId = await sessionsService.generateSessionId();

        const sessionPayload: SessionPayload = {
            userId: user.id,
            username: user.username,
            role: RoleEnum.parse(user.role.name)
        }

        const { expiresAt } = await sessionsService.createSession(
            sessionId,
            user.id,
            sessionPayload,
            userAgent
        )

        return { sessionPayload, sessionId, expiresAt }
    }

    async logout(sessionId: string): Promise<void> {
        await sessionsService.revokeSessionBySessionId(sessionId)
        await prisma.session.update({
            where: { sessionId },
            data: { revokedAt: new Date() }
        });
    }

    async getSessions(userId: string) {
        return await prisma.session.findMany({
            where: {
                userId,
                OR: [
                    { revokedAt: { not: null } },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            omit: { userId: true, updatedAt: true },
            orderBy: { createdAt: "desc" }
        });
    }

    async revokeSession(userId: string, sessionId: string) {
        const sessionPayload = await sessionsService.getSessionPayload(sessionId)

        if (!sessionPayload) {
            throw new NotFoundError("Session not found");
        }

        if (userId !== sessionPayload.userId) {
            throw new UnauthorizedError("Cannot revoke another user's session");
        }

        await sessionsService.revokeSessionBySessionId(sessionId);
    }
}