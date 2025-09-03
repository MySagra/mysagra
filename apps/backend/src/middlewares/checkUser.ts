import { Request, Response, NextFunction } from "express";
import prisma from "@/utils/prisma";

export const checkUniqueUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { username } = req.body;
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: {
            username
        }
    });

    if ((!id && user) || (user && id && id != user.id.toString())) {
        res.status(409).json({ message: "User name already exists, must be unique!" });
        return;
    }
    next();
}

export const checkUserExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(id)
        }
    })

    if (!user) {
        res.status(404).json({ message: "Food not exists" });
        return;
    }
    next();
}