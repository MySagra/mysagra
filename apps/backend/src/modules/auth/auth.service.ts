import { checkHashPassword } from "@/lib/hashPassword";
import { prisma } from "@mysagra/database";
import { Role, User } from "@mysagra/database";
import { TokenService } from "./token.service";
import { redisClient } from "@/lib/redis";

export class AuthService {
    private tokenService = new TokenService();

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

    async login(user: User & { role: Role }, password: string) {
        if (!await checkHashPassword(password, user.password)) return null;
        const accessToken = await this.tokenService.generateToken(user)
        return accessToken
    }

    async logout(token: string) : Promise<Boolean>{
        return await this.tokenService.revokeToken(token);
    }
}