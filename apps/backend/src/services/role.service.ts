import prisma from "@/utils/prisma";

export class RoleService {
    async getRoles() {
        return await prisma.role.findMany();
    }

    async getRoleById(id: number) {
        return await prisma.role.findUnique({
            where: {
                id
            }
        })
    }

    async getRoleByName(name: string) {
        return await prisma.role.findUnique({
            where: {
                name
            }
        })
    }

    async createRole(name: string) {
        return await prisma.role.create({
            data: {
                name
            }
        })
    }

    async updateRole(id: number, name: string) {
        return await prisma.role.update({
            where: {
                id 
            },
            data: {
                name
            }
        })
    }

    async deleteRole(id: number) {
        return await prisma.role.delete({
            where: {
                id  
            }
        })
    }
}