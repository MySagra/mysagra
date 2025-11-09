import { Request, Response, NextFunction } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { FoodService } from "@/services/food.service";
import { GetFoodParams, GetFoodQuery } from "@/schemas";

type GetFoodsRequest = Request<any, any, any, GetFoodQuery>
type GetFoodsByIdRequest = Request<GetFoodParams, any, any, GetFoodQuery>

export class FoodController {
    constructor(private foodService: FoodService) {}
    
    getFoods = asyncHandler(async (req: GetFoodsRequest, res: Response, next: NextFunction): Promise<void> => {
        const { include, group_by } = req.query;
        const foods = await this.foodService.getFoods(include, group_by);
        res.status(200).json(foods);
    });

    getFoodById = asyncHandler(async (req: GetFoodsByIdRequest, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const { include } = req.query;
        const food = await this.foodService.getFoodById(id, include)
        if (!food) {
            res.status(404).json({ message: "Food not found" });
            return;
        }
        res.status(200).json(food);
    });

    getAvailableFoods = asyncHandler(async (req: GetFoodsRequest, res: Response, next: NextFunction): Promise<void> => {
        const { include, group_by } = req.query;
        const foods = await this.foodService.getAvailableFoods(include, group_by);
        res.status(200).json(foods);
    })

    getFoodsByCategoryId = asyncHandler(async (req: GetFoodsByIdRequest, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const { include } = req.query;
        const foods = await this.foodService.getFoodsByCategoryId(parseInt(id), include);
        res.status(200).json(foods);
    })

    getAvailableFoodsByCategoryId = asyncHandler(async (req: GetFoodsByIdRequest, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const { include } = req.query;
        const foods = await this.foodService.getAvailableFoodsByCategoryId(parseInt(id), include);
        res.status(200).json(foods);
    })

    createFood = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { name, description, price, categoryId, available, ingredients } = req.body;
        const food = await this.foodService.createFood(name, description, price, categoryId, available, ingredients);
        res.status(201).json(food);
    });

    updateFood = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const { name, description, price, categoryId, available, ingredients } = req.body;
        const food = await this.foodService.updateFood(id, name, description, price, categoryId, available, ingredients);
        res.status(200).json(food);
    });

    patchFoodAvailable = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const food = await this.foodService.patchAvailableFood(id);
        res.status(200).json(food);
    });

    deleteFood = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        await this.foodService.deleteFood(id);
        res.status(204).send();
    });
}