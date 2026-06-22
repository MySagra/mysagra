import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { UsersService } from "@/modules/users/users.service";

import { CUIDParam, CreateUserInput, PatchUserInput } from "@mysagra/schemas";
import { TypedRequest } from "@/types/request";
import { ForbiddenError, UnauthorizedError } from "@/common/errors";

export class UsersController {
    constructor(private userService: UsersService) { }

    getUsers = asyncHandler(async (
        _req: TypedRequest<{}>,
        res: Response,
    ): Promise<void> => {
        const users = await this.userService.getUsers();
        res.status(200).json(users);
    });

    getUserById = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        if (req.user!.role !== "admin" && req.user!.userId !== id) {
            throw new ForbiddenError("Cannot access another user's profile");
        }
        const user = await this.userService.getUserById(id);
        res.status(200).json(user);
    })

    createUser = asyncHandler(async (
        req: TypedRequest<{ body: CreateUserInput }>,
        res: Response,
    ): Promise<void> => {
        const user = await this.userService.createUser(req.validated.body)
        res.status(201).json(user);
    });

    patchUser = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: PatchUserInput }>,
        res: Response,
    ): Promise<void> => {
        if (!req.user) throw new UnauthorizedError("Not authorized");
        const { id } = req.validated.params;

        if (req.user.userId !== id && req.user.role !== "admin") {
            throw new ForbiddenError("Cannot modify another user");
        }

        if (req.validated.body.role && req.user.role !== "admin") {
            throw new ForbiddenError("Cannot modify your own role");
        }

        const user = await this.userService.patchUser(id, req.validated.body)
        res.status(200).json(user);
    });

    deleteUser = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        await this.userService.deleteUser(id);
        res.status(204).send();
    });
}