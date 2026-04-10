import { RolesService } from "@/modules/roles/roles.service";

import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";

export class RolesController {
    constructor(private roleService: RolesService) { }

    getRoles = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roles = await this.roleService.getRoles();
        res.status(200).json(roles);
    });

    getRoleById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const id = req.params.id as string;
        const role = await this.roleService.getRoleById(id);
        res.status(200).json(role);
    })

    /*
    createRole = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { name } = req.body;
        const role = await this.roleService.createRole(name)
        res.status(201).json(role);
    });

    updateRole = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const id = req.params.id as string;
        const { name } = req.body;
        const role = await this.roleService.updateRole(id, name)
        res.status(200).json(role);
    });

    deleteRole = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const id = req.params.id as string;
        await this.roleService.deleteRole(id);
        res.status(204).send();
    });
    */
}