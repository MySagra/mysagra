import { Request, Response, NextFunction } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { FoodService } from "@/services/food.service";


export class FoodController {
    constructor(private foodService: FoodService) {}
    
    getFoods = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const foods = await this.foodService.getFoods();

        if (!Array.isArray(foods)) {
            res.status(404).json({ message: "Foods not found" })
        }
        res.status(200).json(foods);
    });

    getFoodById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const food = await this.foodService.getFoodById(parseInt(id))
        if (!food) {
            res.status(404).json({ message: "Food not found" });
            return;
        }
        res.status(200).json(food);
    });

    getAvailableFoods = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const foods = await this.foodService.getAvailableFoods();
        res.status(200).json(foods);
    })

    getFoodsByCategoryId = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const foods = await this.foodService.getFoodsByCategoryId(parseInt(id));
        res.status(200).json(foods);
    })

    getAvailableFoodsByCategoryId = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const foods = await this.foodService.getAvailableFoodsByCategoryId(parseInt(id));
        res.status(200).json(foods);
    })

    createFood = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { name, description, price, categoryId, available } = req.body;
        const food = await this.foodService.createFood(name, description, price, categoryId, available);
        res.status(201).json(food);
    });

    updateFood = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const { name, description, price, categoryId, available } = req.body;
        const food = await this.foodService.updateFood(parseInt(id), name, description, price, categoryId, available);
        res.status(200).json(food);
    });

    patchFoodAvailable = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const food = await this.foodService.patchAvailableFood(parseInt(id));
        res.status(200).json(food);
    });

    deleteFood = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        await this.foodService.deleteFood(parseInt(id));
        res.status(204).send();
    });
}