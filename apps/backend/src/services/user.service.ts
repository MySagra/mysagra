import prisma from "@/utils/prisma";
import { createHashPassword } from "@/lib/hashPassword";
import { User } from "@/schemas";

export class UserService {
    async getUsers() {
        return await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true
            }
        });
    }

    async getUserById(id: string) {
        return await prisma.user.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                username: true,
                role: true
            }
        })
    }

    async getUserByUsername(username: string) {
        return await prisma.user.findUnique({
            where: {
                username
            },
            select: {
                id: true,
                username: true,
                role: true
            }
        })
    }

    async createUser(user: User) {
        return await prisma.user.create({
            data: {
                ...user,
                password: await createHashPassword(user.password),
            },
            select: {
                id: true,
                username: true,
                role: true
            }
        })
    }

    async updateUser(id: string, user: User) {
        return await prisma.user.update({
            where: {
                id
            },
            data: {
                ...user,
                password: await createHashPassword(user.password),
            },
            select: {
                id: true,
                username: true,
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