import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import fs from "fs";

import prisma from "@/utils/prisma";
import path from "path";

export const getCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const categories = await prisma.category.findMany({
        orderBy: {
            position: "asc"
        }
    });
    res.status(200).json(categories);
});

export const getAvailableCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const categories = await prisma.category.findMany({
        where: {
            available: true
        },
        orderBy: {
            position: "asc"
        }
    });
    res.status(200).json(categories);
});

export const patchAvailableCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);

    const oldCategory = await prisma.category.findUnique({ where: { id } });

    if (!oldCategory) {
        res.status(404).json({ message: "Food not found" });
        return;
    }

    const patchCategory = await prisma.category.update({
        where: {
            id
        },
        data: {
            ...oldCategory,
            available: !oldCategory?.available
        }
    });
    res.status(200).json(patchCategory);
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);

    const category = await prisma.category.findUnique({
        where: {
            id
        }
    });

    if (!category) {
        res.status(404).json({ message: "Category not found" });
        return;
    }

    res.status(200).json(category);
});

export const createCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, position, available } = req.body;

    const newCategory = await prisma.category.create({
        data: {
            name,
            position: parseInt(position),
            available: available || true
        }
    });

    res.status(201).json(newCategory);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);
    const { name, position, available } = req.body;

    const updatedCategory = await prisma.category.update({
        where: {
            id
        },
        data: {
            name,
            position: parseInt(position),
            available
        }
    });

    if (!updatedCategory) {
        res.status(404).json({ message: "Category not found" });
        return;
    }

    res.status(200).json(updatedCategory);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);

    await prisma.food.deleteMany({
        where: {
            categoryId: id
        }
    })

    const category = await prisma.category.delete({
        where: {
            id
        }
    })

    if (category?.image) {
        const imagePath = path.join(__dirname, "../../public/uploads/categories/", category.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    res.status(200).json({
        message: "Category deleted"
    });
});

export const getImage = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const image = req.params.image;

    const basePath = "../../public";

    const imagePath = path.join(__dirname, basePath, 'uploads', 'categories', image);

    if (fs.existsSync(imagePath)) {
        res.status(200).sendFile(imagePath)
    }
    else {
        res.status(404).sendFile(path.join(__dirname, basePath, 'images', 'noimage.jpg'));
    }
});

export const uploadImage = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);
    const file = req.file;

    if (!req.file) {
        res.status(400).json({ errore: 'File not uploaded' });
        return;
    }

    const oldCategory = await prisma.category.findUnique({
        where: {
            id
        }
    });

    if (oldCategory?.image) {
        const imagePath = path.join(__dirname, "../../public/uploads/categories/", oldCategory.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    const category = await prisma.category.update({
        where: {
            id
        },
        data: {
            image: file?.filename
        }
    });

    res.status(200).json(category);
});