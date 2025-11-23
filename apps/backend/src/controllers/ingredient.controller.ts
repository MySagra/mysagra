import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { IngredientService } from "@/services/ingredient.service";
import { Ingredient } from "@/schemas/ingredient";
import { CUIDParam } from "@/schemas";
import { TypedRequest } from "@/types/request";

export class IngredientController {
    constructor(private ingredientService: IngredientService) { }

    getIngredients = asyncHandler(async (
        req: TypedRequest<{}>, 
        res: Response, 
    ): Promise<void> => {
        const ingredients = await this.ingredientService.getIngredients()

        if (!Array.isArray(ingredients)) {
            res.status(404).json({ message: "Ingredients not found" })
            return;
        }
        res.status(200).json(ingredients);
    });

    getIngredientById = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const ingredient = await this.ingredientService.getIngredientById(id)

        if (!ingredient) {
            res.status(404).json({ message: "Ingredients not found" })
            return;
        }
        res.status(200).json(ingredient);
    });

    createIngredient = asyncHandler(async (
        req: TypedRequest<{body: Ingredient}>, 
        res: Response, 
    ): Promise<void> => {
        const { name } = req.validated.body
        const ingredient = await this.ingredientService.createIngredient(name)

        res.status(201).json(ingredient);
    });

    updateIngredient = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam, body: Ingredient}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const { name } = req.validated.body
        const ingredient = await this.ingredientService.updateIngredient(id, name)

        res.status(200).json(ingredient);
    });

    deleteIngredient = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        await this.ingredientService.deleteIngredient(id)

        res.status(204).send();
    });
}