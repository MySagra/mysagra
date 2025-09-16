import { checkHashPassword } from "@/lib/hashPassword";
import { generateJwt } from "@/lib/JWT";
import prisma from "@/utils/prisma";
import { User } from "@generated/prisma_client";


export class AuthService {
    async getUser(username: string) {
        const user = await prisma.user.findUnique({
            where: {
                username
            },
            include: {
                role: true
            }
        });

        return user;
    }

    async generateToken(user: User & { role: { id: number; name: string } }, password: string) {
        if (!await checkHashPassword(password, user.password)) return null;

        return {
            user: {
                username: user.username,
                role: user.role.name
            },
            token: generateJwt(user)
        }
    }
}