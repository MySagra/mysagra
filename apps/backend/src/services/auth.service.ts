import { checkHashPassword } from "@/lib/hashPassword";
import prisma from "@/utils/prisma";
import { Role, User } from "@generated/prisma_client";
import { TokenService } from "./token.service";

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

    async login(user: User & { role: Role }, password: string, ip? : string, userAgent?: string) {
        if (!await checkHashPassword(password, user.password)) return null;

        const refreshToken = await this.tokenService.generateRefreshToken(user.id, ip, userAgent)
        const accessToken = await this.tokenService.generateAccessToken(user)

        return {
            accessToken,
            refreshToken
        }
    }

    async logout(refreshToken: string) : Promise<Boolean>{
        return await this.tokenService.revokeToken(refreshToken);
    }

    async revokeToken(refreshToken: string){
        return await this.tokenService.revokeToken(refreshToken);
    }

    async refresh(refreshToken: string) : Promise<string | null>{
        if(!await this.tokenService.isRefreshTokenValid(refreshToken)) return null;
        const payload = this.tokenService.getPayload(refreshToken);
        if(!payload?.sub) return null;

        const user = await prisma.user.findUnique({
            where: {
                id: payload.sub
            },
            select: {
                id: true,
                username: true,
                password: true,
                roleId: true,
                role: true
            }
        })
        if(!user) return null;
        return this.tokenService.generateAccessToken(user)
    }
}