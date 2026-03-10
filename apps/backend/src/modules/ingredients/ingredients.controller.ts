import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { IngredientService } from "@/services/ingredient.service";
import { CreateIngredientInput, UpdateIngredientInput } from "@/schemas"
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
        req: TypedRequest<{body: CreateIngredientInput}>, 
        res: Response, 
    ): Promise<void> => {
        const ingredient = await this.ingredientService.createIngredient(req.validated.body)

        res.status(201).json(ingredient);
    });

    updateIngredient = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam, body: UpdateIngredientInput}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const ingredient = await this.ingredientService.updateIngredient(id, req.validated.body)

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