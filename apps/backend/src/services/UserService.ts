import prisma from "@/utils/prisma";

import { createHashPassword } from "@/lib/hashPassword";

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

    async getUserById(id: number) {
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

    async createUser(username: string, password: string, roleId: number) {
        return await prisma.user.create({
            data: {
                username,
                password: await createHashPassword(password),
                roleId
            },
            select: {
                id: true,
                username: true,
                role: true
            }
        })
    }

    async updateUser(id: number, username: string, password: string, roleId: number) {
        return await prisma.user.update({
            where: {
                id
            },
            data: {
                username,
                password: await createHashPassword(password),
                roleId
            },
            select: {
                id: true,
                username: true,
                role: true
            }
        })
    }

    async deleteUser(id: number) {
        return await prisma.user.delete({
            where: {
                id
            }
        });
    }
}