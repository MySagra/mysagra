import { prisma } from "@mysagra/database";
import { createHashPassword } from "@/lib/hashPassword";
import { CreateUserInput, PatchUserInput, UpdateUserInput } from "@mysagra/schemas";
import { NotFoundError } from "@/common/errors";

export class UsersService {
    async getUsers() {
        return await prisma.user.findMany({
            omit: {
                password: true
            },
            include: {
                role: true
            }
        });
    }

    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: {
                id
            },
            omit: {
                password: true
            },
            include: {
                role: true
            }
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        return user;
    }

    async getUserByUsername(username: string) {
        return await prisma.user.findUnique({
            where: {
                username
            },
            omit: {
                password: true
            },
            include: {
                role: true
            }
        })
    }

    async createUser(user: CreateUserInput) {
        return await prisma.user.create({
            data: {
                ...user,
                password: await createHashPassword(user.password),
            },
            omit: {
                password: true
            },
            include: {
                role: true
            }
        })
    }

    //TODO: update after session manage
    async updateUser(id: string, user: UpdateUserInput) {
        return await prisma.user.update({
            where: {
                id
            },
            data: {
                ...user,
                password: await createHashPassword(user.password),
            },
            omit: {
                password: true
            },
            include: {
                role: true
            }
        })
    }

    async patchUser(id: string, user: PatchUserInput) {
        return await prisma.user.update({
            where: {
                id
            },
            data: {
                roleId: user.role
            },
            omit: {
                password: true
            },
            include: {
                role: true
            }
        })
    }

    async deleteUser(id: string) {
        return await prisma.user.delete({
            where: {
                id
            }
        });
    }
}