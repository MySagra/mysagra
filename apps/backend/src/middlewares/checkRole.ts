import { Request, Response, NextFunction } from "express";
import prisma from "@/utils/prisma";

export const checkUniqueRoleName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name } = req.body;
    const { id } = req.params;

    const role = await prisma.role.findUnique({
        where: {
            name
        }
    });

    if ((!id && role) || (role && id && id != role.id.toString())) {
        res.status(409).json({ message: "Role name already exists, must be unique!" });
        return;
    }
    next();
}

export const checkRoleExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
        where: {
            id: parseInt(id)
        }
    })

    if (!role) {
        res.status(404).json({ message: "Food not exists" });
        return;
    }
    next();
}