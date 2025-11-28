import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { UserService } from "@/services/user.service";

import { CUIDParam, UpdateUserInput } from "@/schemas";
import { CreateUserInput } from "@/schemas";
import { TypedRequest } from "@/types/request";

export class UserController {
    constructor(private userService: UserService) { }

    getUsers = asyncHandler(async (
        req: TypedRequest<{}>, 
        res: Response, 
    ): Promise<void> => {
        const users = await this.userService.getUsers();

        if (!Array.isArray(users)) {
            res.status(404).json({ message: "Users not found" })
            return;
        }

        res.status(200).json(users);
    });

    getUserById = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const user = await this.userService.getUserById(id);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json(user);
    })

    createUser = asyncHandler(async (
        req: TypedRequest<{body: CreateUserInput}>,
        res: Response, 
    ): Promise<void> => {
        const user = await this.userService.createUser(req.validated.body)
        res.status(201).json(user);
    });

    updateUser = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam, body: UpdateUserInput}>,
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const user = await this.userService.updateUser(id, req.validated.body)
        res.status(200).json(user);
    });

    deleteUser = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        await this.userService.deleteUser(id);
        res.status(204).send();
    });
}