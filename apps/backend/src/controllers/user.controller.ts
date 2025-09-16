import { NextFunction, Request, Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { UserService } from "@/services/user.service";

export class UserController {
    constructor(private userService: UserService) { }

    getUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const users = await this.userService.getUsers();

        if (!Array.isArray(users)) {
            res.status(404).json({ message: "Users not found" })
        }

        res.status(200).json(users);
    });

    getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const id = parseInt(req.params.id);
        const user = await this.userService.getUserById(id);

        if (!user) {
            res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    })

    createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { username, password, roleId } = req.body;
        const user = await this.userService.createUser(username, password, roleId)
        res.status(201).json(user);
    });

    updateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const id = parseInt(req.params.id);
        const { username, password, roleId } = req.body;
        const user = await this.userService.updateUser(id, username, password, roleId)
        res.status(200).json(user);
    });

    deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const id = parseInt(req.params.id);
        await this.userService.deleteUser(id);
        res.status(204).send();
    });
}