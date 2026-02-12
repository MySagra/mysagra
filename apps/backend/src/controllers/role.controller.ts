import { RoleService } from "@/services/role.service";

import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";

export class RoleController {
    constructor(private roleService: RoleService) { }

    getRoles = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roles = await this.roleService.getRoles();

        if (!Array.isArray(roles)) {
            res.status(404).json({ message: "Roles not found" })
            return;
        }

        res.status(200).json(roles);
    });

    getRoleById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const id = req.params.id as string;
        const role = await this.roleService.getRoleById(id);
        if (!role) {
            res.status(404).json({ message: "Role not found" });
            return;
        }
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