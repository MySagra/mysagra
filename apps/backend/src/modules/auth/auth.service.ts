import { checkHashPassword } from "@/lib/hashPassword";
import { prisma } from "@mysagra/database";
import { Role, User } from "@mysagra/database";
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

    async login(user: User & { role: Role }, password: string) {
        if (!await checkHashPassword(password, user.password)) return null;
        const accessToken = await this.tokenService.generateToken(user)
        return accessToken
    }

    /*
    async logout(refreshToken: string) : Promise<Boolean>{
        return await this.tokenService.revokeToken(refreshToken);
    }
    

    async revokeToken(refreshToken: string) {
        return await this.tokenService.revokeToken(refreshToken);
    }

    async refresh(refreshToken: string): Promise<string | null> {
        if (!await this.tokenService.isRefreshTokenValid(refreshToken)) return null;
        const payload = this.tokenService.getRefreshTokenPayload(refreshToken);
        if (!payload?.sub) return null;

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
        if (!user) return null;
        return await this.tokenService.generateAccessToken(user)
    }
    */
}