import { prisma } from "@mysagra/database";
import { NotFoundError } from "@/common/errors";

export class RolesService {
    async getRoles() {
        return await prisma.role.findMany();
    }

    async getRoleById(id: string) {
        const role = await prisma.role.findUnique({
            where: {
                id
            }
        });

        if (!role) {
            throw new NotFoundError("Role not found");
        }

        return role;
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

    async updateRole(id: string, name: string) {
        return await prisma.role.update({
            where: {
                id 
            },
            data: {
                name
            }
        })
    }

    async deleteRole(id: string) {
        return await prisma.role.delete({
            where: {
                id  
            }
        })
    }
}