import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { FoodService } from "@/services/food.service";
import { CUIDParam, Food, GetFoodParams, GetFoodQuery, GetFoodsQuery, PatchFood } from "@/schemas";
import { TypedRequest } from "@/types/request";

export class FoodController {
    constructor(private foodService: FoodService) { }

    getFoods = asyncHandler(async (
        req: TypedRequest<{query: GetFoodsQuery}>, 
        res: Response, 
    ): Promise<void> => {
        const foods = await this.foodService.getFoods(req.validated.query);
        res.status(200).json(foods);
    });

    getFoodById = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam, query: GetFoodQuery}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const food = await this.foodService.getFoodById(id, req.validated.query)
        if (!food) {
            res.status(404).json({ message: "Food not found" });
            return;
        }
        res.status(200).json(food);
    });

    createFood = asyncHandler(async (
        req: TypedRequest<{body: Food}>, 
        res: Response, 
    ): Promise<void> => {
        const food = await this.foodService.createFood(req.validated.body);
        res.status(201).json(food);
    });

    updateFood = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam, body: Food}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const food = await this.foodService.updateFood(id, req.validated.body);
        res.status(200).json(food);
    });

    patchFood = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam, body: PatchFood}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const food = await this.foodService.patchFood(id, req.validated.body);
        res.status(200).json(food);
    });

    deleteFood = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        await this.foodService.deleteFood(id);
        res.status(204).send();
    });
}