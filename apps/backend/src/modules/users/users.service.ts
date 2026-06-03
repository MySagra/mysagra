import { prisma } from "@mysagra/database";
import { createHashPassword } from "@/lib/hashPassword";
import { CreateUserInput, PatchUserInput } from "@mysagra/schemas";
import { NotFoundError } from "@/common/errors";
import { sessionsService } from "../auth/sessions.service";

export class UsersService {
    async getUsers() {
        return await prisma.user.findMany({
            omit: { password: true },
            include: { role: true }
        });
    }

    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            omit: { password: true },
            include: { role: true }
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        return user;
    }

    async getUserByUsername(username: string) {
        return await prisma.user.findUnique({
            where: { username },
            omit: { password: true },
            include: { role: true }
        })
    }

    async createUser(user: CreateUserInput) {
        return await prisma.user.create({
            data: {
                ...user,
                password: await createHashPassword(user.password),
            },
            omit: { password: true },
            include: { role: true }
        })
    }

    async patchUser(id: string, user: PatchUserInput) {
        if(user.password) {
            user.password = await createHashPassword(user.password);
        }

        const { role, ...rest } = user;
        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...rest,
                ...(role && { role: { connect: { id: role } } })
            },
            omit: { password: true },
            include: { role: true }
        });

        if(user.password || user.role) {
            await sessionsService.revokeSessionByUserId(id);
        }
        
        return updated;
    }

    async deleteUser(id: string) {
        await sessionsService.revokeSessionByUserId(id);
        await prisma.user.delete({ where: { id } });
    }
}