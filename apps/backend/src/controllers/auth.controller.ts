import { NextFunction, Request, Response } from "express";
import { AuthService } from "@/services/auth.service";
import { asyncHandler } from "@/utils/asyncHandler";

export class AuthController {
    constructor(private authService: AuthService) { }

    login = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { username, password} = req.body;
        const user = await this.authService.getUser(username);

        if(!user){
            res.status(404).json({
                message: "User not exist"
            })
            return;
        }

        const userToken = await this.authService.generateToken(user, password);
        if(!userToken){
            res.status(401).json({
                message: "Unauthorized"
            });
            return;
        }

        res.status(200).json(userToken);
    });
}