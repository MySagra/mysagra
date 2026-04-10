import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { UsersService } from "@/modules/users/users.service";

import { CUIDParam, UpdateUserInput, CreateUserInput, PatchUserInput } from "@mysagra/schemas";
import { TypedRequest } from "@/types/request";

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

    //TODO: update after session management
    updateUser = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: UpdateUserInput }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const user = await this.userService.updateUser(id, req.validated.body)
        res.status(200).json(user);
    });

    patchUser = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: PatchUserInput }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
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