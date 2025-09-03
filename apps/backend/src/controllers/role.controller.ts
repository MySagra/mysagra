import { NextFunction, Request, Response } from "express";

import prisma from "@/utils/prisma";
import { asyncHandler } from "@/utils/asyncHandler";

export const getRoles = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const roles = await prisma.role.findMany();
    res.status(200).json(roles);
});

export const getRoleById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);

    const role = await prisma.role.findUnique({
        where: {
            id
        }
    });

    if (!role) {
        res.status(404).json({ message: "Role not found" });
        return;
    }

    res.status(200).json(role);
});

export const createRole = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name } = req.body;

    const newRole = await prisma.role.create({
        data: {
            name
        }
    });

    res.status(201).json(newRole);
});

export const updateRole = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);
    const { name } = req.body;

    const updatedRole = await prisma.role.update({
        where: {
            id
        },
        data: {
            name
        }
    });

    if (!updatedRole) {
        res.status(404).json({ message: "Role not found" });
        return;
    }

    res.status(201).json(updatedRole);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);

    await prisma.role.delete({
        where: {
            id
        }
    });

    res.status(200).json({
        message: "Role deleted"
    });
});