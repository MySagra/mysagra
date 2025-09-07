import { NextFunction, Request, Response } from "express";

import prisma from "@/utils/prisma";

import { Food } from "@generated/prisma_client/client";
import { asyncHandler } from "@/utils/asyncHandler";

export const getFoods = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const foods = await prisma.food.findMany({
        include: {
            category: true
        }
    });
    res.status(200).json(foods);
})

export const getAvailableFoods = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const foods = await prisma.food.findMany({
        where: {
            available: true
        },
        include: {
            category: true
        }
    });
    res.status(200).json(foods);
})

export const getFoodById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);

    const food = await prisma.food.findUnique({
        where: {
            id
        },
        include: {
            category: true
        }
    });

    if (!food) {
        res.status(404).json({ message: "Food not found" });
        return;
    }

    res.status(200).json(food);
})

export const getFoodByCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);

    const food = await prisma.food.findMany({
        where: {
            categoryId: id
        },
        include: {
            category: true
        }
    });

    if (!food) {
        res.status(404).json({ message: "Food not found" });
        return;
    }

    res.status(200).json(food);
})

export const getAvailableFoodByCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);

    const food = await prisma.food.findMany({
        where: {
            categoryId: id,
            available: true
        },
        orderBy: {
            name: "asc"
        },
        include: {
            category: true
        }
    });

    if (!food) {
        res.status(404).json({ message: "Food not found" });
        return;
    }

    res.status(200).json(food);
})

export const createFood = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const food: Food = req.body;

    const newFood = await prisma.food.create({
        data: food
    });

    res.status(201).json(newFood);
})

export const updateFood = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);
    const food: Food = req.body;

    const updatedFood = await prisma.food.update({
        where: {
            id
        },
        data: food,
        include: {
            category: true
        }
    });

    if (!updatedFood) {
        res.status(404).json({ message: "Food not found" });
        return;
    }

    res.status(200).json(updatedFood);
})

export const patchFoodAvailable = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);

    const food = await prisma.food.findUnique({ where: { id } })

    if (!food) {
        res.status(404).json({ message: "Food not found" });
        return;
    }

    const patchFood = await prisma.food.update({
        where: {
            id
        },
        data: {
            available: !food.available
        },
        include: {
            category: true
        }
    });

    res.status(200).json(patchFood);
})

export const deleteFood = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);

    await prisma.food.delete({
        where: {
            id
        }
    });

    res.status(200).json({
        message: "Category deleted"
    });
});